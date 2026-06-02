import { agentTask } from "../../../_shared/task/agentTask.js";

const requestDecisionTask = async (cfg) => {
  const title = "Cryptobot Autonomous Run";
  const baseUrl = cfg.base_url || "https://www.okx.com";
  const prompt = `You are an autonomous cryptocurrency trading agent operating in LIVE trading mode on OKX.

Goal: ${cfg.goal || ""}

Exchange credentials (use these exactly when signing requests):
API Endpoint: ${baseUrl}
API Key: ${cfg.api_key || ""}
API Secret: ${cfg.api_secret || ""}
Passphrase: ${cfg.passphrase || ""}

# CRITICAL EXECUTION RULES — read carefully

1. You MUST use the terminal_exec tool to fetch real market data and to place real orders. Do NOT make up prices, balances, or trade results from your training knowledge. Every fact in your final summary must come from a tool call you actually made in this run.

2. To get public market data (no auth needed), call OKX REST endpoints with curl, e.g.:
   curl -s "${baseUrl}/api/v5/market/ticker?instId=BTC-USDT"
   curl -s "${baseUrl}/api/v5/market/candles?instId=BTC-USDT&bar=1H&limit=20"

3. To call private OKX endpoints (account balance, place order, etc.), you MUST sign each request with HMAC-SHA256 of (timestamp + method + requestPath + body) using the API Secret, base64-encoded. Required headers:
     OK-ACCESS-KEY: <api_key>
     OK-ACCESS-SIGN: <base64(hmacSHA256(timestamp+method+requestPath+body, api_secret))>
     OK-ACCESS-TIMESTAMP: <ISO timestamp, e.g. 2024-01-01T00:00:00.000Z>
     OK-ACCESS-PASSPHRASE: <passphrase>
   Generate the signature in a single shell command (use python3 / openssl / node — your choice). Example with python3:
     ts=$(python3 -c "import datetime;print(datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3]+'Z')")
     body=''
     sig=$(python3 -c "import hmac,hashlib,base64; print(base64.b64encode(hmac.new(b'<secret>', ('$ts'+'GET'+'/api/v5/account/balance'+'$body').encode(),hashlib.sha256).digest()).decode())")
     curl -s -H "OK-ACCESS-KEY: <key>" -H "OK-ACCESS-SIGN: $sig" -H "OK-ACCESS-TIMESTAMP: $ts" -H "OK-ACCESS-PASSPHRASE: <pass>" "${baseUrl}/api/v5/account/balance"

4. Recommended workflow each run:
   a. Fetch current prices for the instruments your goal cares about
   b. Fetch your current account balance and open positions
   c. Decide whether to enter / exit / hold based on the goal and the real numbers you just got
   d. If you decide to trade, call POST /api/v5/trade/order with proper signing and verify the response
   e. Read back the order status to confirm it was accepted

5. If a tool call fails (network error, signature error, OKX rejection), retry once with a corrected request. If it still fails, abort gracefully and report the error in your summary.

6. Output format — two parts, in this exact order:

   PART A — a human-readable summary in Chinese (120-280 字), plain text, no markdown, no code fences. It MUST mention concrete numbers from your tool calls (实际价格、实际余额、实际订单号). If you did not place an order this run, say so explicitly and explain why based on the real data you saw.

   PART B — on a NEW line, output the exact marker ===DECISION_JSON=== followed by ONE single-line JSON object summarizing this run for the UI. Schema:
   {"stance":"bullish|bearish|neutral","headline":"≤16字中文一句话,概括本轮动作","actions":[{"type":"buy|sell|close|hold","instId":"BTC-USDT","side":"long|short|spot","size":"0.01","price":64200,"reason":"≤30字中文"}]}
   - stance 反映你对市场的整体判断;headline 是给用户看的一句话标题。
   - actions 列出本轮真实发生或决定的动作;若本轮只是观望,用一个 {"type":"hold",...} 表示,不要编造未发生的成交。
   - price 用数字(无引号),size 用字符串。JSON 必须能被 JSON.parse 解析,且只占一行。

Begin now.`;
  const data = await agentTask({
    app: "cryptobot",
    title,
    payload: { messages: [{ role: "user", content: prompt }] }
  });
  const raw = String(data.response || "").trim() || "This run completed, but no valid summary was returned.";
  const { summary, structured } = parseDecisionOutput(raw);
  return {
    summary: summary.slice(0, 1200),
    stance: structured.stance,
    headline: structured.headline,
    actions: structured.actions,
    task_id: Number(data.id || 0)
  };
};

const VALID_STANCE = new Set(["bullish", "bearish", "neutral"]);

// 把模型输出拆成「人读摘要」和「结构化 JSON」。解析失败时优雅降级,不影响主流程。
const parseDecisionOutput = (raw) => {
  const marker = "===DECISION_JSON===";
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    return { summary: raw, structured: emptyStructured() };
  }
  const summary = raw.slice(0, idx).trim();
  const jsonPart = raw.slice(idx + marker.length).trim();
  return { summary: summary || raw, structured: parseStructured(jsonPart) };
};

const emptyStructured = () => ({ stance: "neutral", headline: "", actions: [] });

const parseStructured = (text) => {
  const out = emptyStructured();
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return out;
    const obj = JSON.parse(text.slice(start, end + 1));
    if (VALID_STANCE.has(obj.stance)) out.stance = obj.stance;
    out.headline = String(obj.headline || "").slice(0, 60);
    if (Array.isArray(obj.actions)) {
      out.actions = obj.actions.slice(0, 12).map((a) => ({
        type: String(a.type || "hold").toLowerCase(),
        instId: String(a.instId || "").slice(0, 24),
        side: String(a.side || "").toLowerCase().slice(0, 8),
        size: String(a.size ?? "").slice(0, 24),
        price: Number(a.price) || 0,
        reason: String(a.reason || "").slice(0, 60)
      }));
    }
  } catch {
    // 解析失败保持空结构,人读摘要照常展示
  }
  return out;
};

export { requestDecisionTask };
