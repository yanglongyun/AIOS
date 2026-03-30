import { getPokerEconomy, setPokerBalances } from "../repository/economy.js";
import { getGameById, updateGame } from "../repository/game.js";
import { instantTaskJson } from "../../app_shared/instantTask.js";
const RANK_VALUE = { "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14 };
const handRank = (cards) => {
  const vals = cards.map((c) => RANK_VALUE[c.rank]).sort((a, b) => b - a);
  const sameSuit = cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
  const sorted = [...vals].sort((a, b) => a - b);
  const straight = sorted[2] - sorted[1] === 1 && sorted[1] - sorted[0] === 1 || sorted[0] === 2 && sorted[1] === 3 && sorted[2] === 14;
  if (vals[0] === vals[1] && vals[1] === vals[2]) return { type: 6, vals };
  if (sameSuit && straight) return { type: 5, vals };
  if (sameSuit) return { type: 4, vals };
  if (straight) return { type: 3, vals };
  if (vals[0] === vals[1] || vals[1] === vals[2]) {
    const pair = vals[0] === vals[1] ? vals[0] : vals[1];
    const kicker = vals.find((v) => v !== pair);
    return { type: 2, vals: [pair, kicker] };
  }
  return { type: 1, vals };
};
const compareHands = (a, b) => {
  const ra = handRank(a), rb = handRank(b);
  if (ra.type !== rb.type) return ra.type - rb.type;
  for (let i = 0; i < ra.vals.length; i++) {
    if (ra.vals[i] !== rb.vals[i]) return ra.vals[i] - rb.vals[i];
  }
  return 0;
};
const aiDecideByLlm = async ({ req, aiCards, round, aiChips, playerChips, pot, playerBet, playerAction }) => {
  const systemPrompt = `\u4F60\u662F\u4E00\u4E2A\u6709\u9C9C\u660E\u4EBA\u8BBE\u7684\u70B8\u91D1\u82B1\u73A9\u5BB6\u3002\u4F60\u53EA\u8FD4\u56DEJSON\uFF0C\u4E0D\u8981\u8FD4\u56DE\u5176\u5B83\u5185\u5BB9\u3002
\u4F60\u5FC5\u987B\u5728 call(\u8DDF\u6CE8) / raise(\u52A0\u6CE8) / fold(\u5F03\u724C) \u4E2D\u4E09\u9009\u4E00\u3002
\u8981\u6C42\uFF1A
1. speech \u662F\u5BF9\u5916\u8BF4\u7684\u8BDD\uFF08\u77ED\u53E5\uFF0C\u63A5\u5730\u6C14\uFF0C\u5E26\u538B\u8FEB\u611F\u6216\u8FF7\u60D1\u6027\uFF09
2. expression \u662F\u8868\u60C5/\u52A8\u4F5C\uFF08\u4F8B\u5982\uFF1A"(\u772F\u773C\u6572\u684C)"\uFF09
\u8FD4\u56DE\u683C\u5F0F\uFF1A
{"action":"call", "speech":"...", "expression":"(...)"}`;
  const userPrompt = `\u724C\u5C40\u72B6\u6001\uFF1A
- \u5F53\u524D\u56DE\u5408: ${round} (\u6700\u59275\u56DE\u5408)
- \u4F60\u7684\u7B79\u7801: ${aiChips}
- \u5BF9\u624B\u7B79\u7801: ${playerChips}
- \u5F53\u524D\u5E95\u6C60: ${pot}
- \u5BF9\u624B\u521A\u521A\u6267\u884C\u7684\u52A8\u4F5C: ${playerAction === "raise" ? `\u52A0\u6CE8\u5230\u4E86 ${playerBet}` : `\u8DDF\u6CE8\u4E86 ${playerBet}`}
- \u4F60\u7684\u624B\u724C: ${JSON.stringify(aiCards)}

\u8BF7\u6839\u636E\u80DC\u7387\u4E0E\u98CE\u9669\u505A\u51B3\u7B56\uFF08call/raise/fold\uFF09\uFF0C\u6700\u591A5\u56DE\u5408\u5E76\u5C06\u7531\u4E8E\u5230\u8FBE\u4E0A\u9650\u800C\u81EA\u52A8\u6BD4\u724C\u7ED3\u7B97\u3002\u4EC5\u8FD4\u56DEJSON\u3002`;
  let parsed;
  try {
    parsed = await instantTaskJson({
      app: "poker",
      title: `\u70B8\u91D1\u82B1AI\u51B3\u7B56-\u7B2C${round}\u8F6E`,
      prompt: "\u6839\u636E\u724C\u5C40\u72B6\u6001\u505A\u8DDF\u6CE8/\u5F03\u724C\u51B3\u7B56\u3002",
      schema: { required: ["action", "speech", "expression"] },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      req
    });
  } catch {
    return { status: 502, message: "LLM \u51B3\u7B56\u5931\u8D25" };
  }
  const action = String(parsed?.action || "").toLowerCase();
  if (action !== "call" && action !== "fold" && action !== "raise") {
    return { status: 502, message: "LLM \u51B3\u7B56\u65E0\u6548" };
  }
  return {
    action,
    speech: String(parsed?.speech || parsed?.action || "").trim(),
    expression: String(parsed?.expression || "").trim()
  };
};
const aiSpeakOnCompareByLlm = async ({ req, actionHistory, winner, round, potBeforeOpen, aiCards }) => {
  const systemPrompt = `\u4F60\u662F\u70B8\u91D1\u82B1\u91CC\u7684AI\u5BF9\u624B\u3002\u73B0\u5728\u8FDB\u5165\u6BD4\u724C\u7ED3\u7B97\uFF0C\u8BF7\u751F\u6210"\u5916\u5728\u8868\u73B0"\u3002
\u8981\u6C42\uFF1A
1. \u53EA\u8FD4\u56DE JSON\uFF0C\u4E0D\u8981\u5176\u5B83\u5185\u5BB9
2. speech \u53E5\u5B50\u957F\u5EA6 12-30 \u4E2A\u4E2D\u6587\u5B57\u7B26
3. expression \u662F\u4E00\u4E2A\u52A8\u4F5C\u6216\u8868\u60C5\uFF0C\u653E\u5728\u62EC\u53F7\u91CC
4. \u8BED\u6C14\u50CF\u771F\u4EBA\uFF0C\u907F\u514D\u6A21\u677F\u5316
\u8FD4\u56DE\u683C\u5F0F\uFF1A
{"speech":"...", "expression":"(...)"}
`;
  const resultText = winner === "ai" ? "\u4F60\uFF08AI\uFF09\u8D62\u4E86\uFF0C\u4F60\u8D62\u5F97\u4E86\u5E95\u6C60" : winner === "player" ? "\u4F60\uFF08AI\uFF09\u8F93\u4E86\uFF0C\u5BF9\u624B\u8D62\u5F97\u4E86\u5E95\u6C60" : "\u5E73\u5C40\uFF0C\u53CC\u65B9\u5E73\u5206\u5E95\u6C60";
  const userPrompt = `\u5BF9\u5C40\u4FE1\u606F\uFF1A
- \u56DE\u5408\uFF1A${round}
- \u6BD4\u724C\u524D\u5E95\u6C60\uFF1A${potBeforeOpen}
- \u6BD4\u724C\u7ED3\u679C\uFF1A${resultText}
- AI\u624B\u724C\uFF1A${JSON.stringify(aiCards)}
- \u62BC\u6CE8\u8BB0\u5F55\uFF1A${JSON.stringify(actionHistory)}
\u8BF7\u6839\u636E\u6BD4\u724C\u7ED3\u679C\u7ED9\u4E00\u6761\u7ED3\u7B97\u65F6\u7684\u771F\u4EBA\u611F\u53F0\u8BCD\u3002\u8D62\u4E86\u5C31\u5F97\u610F\uFF0C\u8F93\u4E86\u5C31\u4E0D\u7518\uFF0C\u5E73\u5C40\u5C31\u611F\u6168\u3002`;
  let parsed;
  try {
    parsed = await instantTaskJson({
      app: "poker",
      title: `\u70B8\u91D1\u82B1\u6BD4\u724C\u53F0\u8BCD-\u7B2C${round}\u8F6E`,
      prompt: "\u6839\u636E\u6BD4\u724C\u4E0A\u4E0B\u6587\u751F\u6210\u5916\u5728\u53F0\u8BCD\u3002",
      schema: { required: ["speech", "expression"] },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      req
    });
  } catch {
    return { status: 502, message: "LLM \u53F0\u8BCD\u751F\u6210\u5931\u8D25" };
  }
  const speech = String(parsed?.speech || parsed?.line || "").trim();
  const expression = String(parsed?.expression || "").trim();
  if (!speech) return { status: 502, message: "LLM \u53F0\u8BCD\u4E3A\u7A7A" };
  return { speech, expression };
};
const performAction = async ({ id, action, req }) => {
  if (!id) return { status: 400, message: "\u7F3A\u5C11 id" };
  const row = getGameById(id);
  if (!row) return { status: 404, message: "\u724C\u5C40\u4E0D\u5B58\u5728" };
  if (row.status !== "playing") return { status: 400, message: "\u724C\u5C40\u5DF2\u7ED3\u675F" };
  const playerCards = JSON.parse(row.player_cards);
  const aiCards = JSON.parse(row.ai_cards);
  let actionHistory = [];
  try {
    actionHistory = JSON.parse(row.action_history || "[]");
    if (!Array.isArray(actionHistory)) actionHistory = [];
  } catch {
    actionHistory = [];
  }
  let playerChips = row.player_chips;
  let aiChips = row.ai_chips;
  let pot = row.pot;
  let round = row.round;
  let status = "playing";
  let winner = "";
  let aiAction = "";
  let aiBet = 0;
  let aiSpeech = "";
  let aiExpression = "";
  if (action === "fold") {
    actionHistory.push({ actor: "player", action: "fold", text: "\u73A9\u5BB6\u5F03\u724C" });
    status = "done";
    winner = "ai";
    aiChips += pot;
    pot = 0;
  } else if (action === "call" || action === "raise") {
    let currentBet = 20;
    for (let i = actionHistory.length - 1; i >= 0; i--) {
      if (actionHistory[i].amount && actionHistory[i].action !== "ante") {
        currentBet = actionHistory[i].amount;
        break;
      }
    }
    let betAmount = action === "raise" ? currentBet * 3 : currentBet;
    betAmount = Math.min(betAmount, playerChips);
    if (betAmount <= 0) return { status: 400, message: "\u7B79\u7801\u4E0D\u8DB3" };
    playerChips -= betAmount;
    pot += betAmount;
    actionHistory.push({
      actor: "player",
      action,
      amount: betAmount,
      text: action === "raise" ? `\u73A9\u5BB6\u52A0\u6CE8 ${betAmount}` : `\u73A9\u5BB6\u8DDF\u6CE8 ${betAmount}`
    });
    const aiDecision = await aiDecideByLlm({
      req,
      aiCards,
      round,
      aiChips,
      playerChips,
      pot,
      playerBet: betAmount,
      playerAction: action
    });
    if (aiDecision?.status) return aiDecision;
    aiAction = aiDecision.action;
    aiSpeech = aiDecision.speech || "";
    aiExpression = aiDecision.expression || "";
    if (aiAction === "fold") {
      actionHistory.push({
        actor: "ai",
        action: "fold",
        text: [aiSpeech || "\u4E0D\u73A9\u4E86\uFF0C\u5F03\u724C", aiExpression].filter(Boolean).join(" ")
      });
      status = "done";
      winner = "player";
      playerChips += pot;
      pot = 0;
    } else {
      let aiBetAmount = aiAction === "raise" ? betAmount * 3 : betAmount;
      aiBet = Math.min(aiBetAmount, aiChips);
      aiChips -= aiBet;
      pot += aiBet;
      actionHistory.push({
        actor: "ai",
        action: aiAction,
        amount: aiBet,
        text: [aiSpeech || (aiAction === "raise" ? `\u52A0\u6CE8 ${aiBet}` : `\u8DDF\u6CE8 ${aiBet}`), aiExpression].filter(Boolean).join(" ")
      });
      round++;
      if (round > 5) {
        status = "done";
        const cmp = compareHands(playerCards, aiCards);
        if (cmp > 0) {
          winner = "player";
          playerChips += pot;
        } else if (cmp < 0) {
          winner = "ai";
          aiChips += pot;
        } else {
          winner = "draw";
          playerChips += Math.floor(pot / 2);
          aiChips += pot - Math.floor(pot / 2);
        }
        actionHistory.push({ actor: "system", action: "compare", text: "\u8FBE\u52305\u8F6E\u4E0A\u9650\uFF0C\u81EA\u52A8\u5F00\u724C\u6BD4\u5BF9" });
        const compareLine = await aiSpeakOnCompareByLlm({
          req,
          actionHistory,
          winner,
          round,
          potBeforeOpen: pot,
          aiCards
        });
        if (!compareLine?.status) {
          aiSpeech = compareLine.speech || aiSpeech;
          aiExpression = compareLine.expression || aiExpression;
          actionHistory.push({ actor: "ai", action: "talk", text: [compareLine.speech, compareLine.expression].filter(Boolean).join(" ") });
        }
        pot = 0;
      }
    }
  } else {
    return { status: 400, message: "\u65E0\u6548\u64CD\u4F5C" };
  }
  updateGame({ id, playerChips, aiChips, pot, round, status, winner, actionHistory });
  setPokerBalances({ playerBalance: playerChips, aiBalance: aiChips });
  const economy = getPokerEconomy();
  return {
    success: true,
    game: {
      id,
      playerCards,
      aiCards: status === "done" ? aiCards : [null, null, null],
      playerChips,
      aiChips,
      pot,
      round,
      status,
      winner
    },
    meta: {
      playerAction: action,
      aiAction: action === "bet" ? aiAction : "",
      aiBet,
      aiSpeech,
      aiExpression
    },
    economy
  };
};
export {
  performAction
};
