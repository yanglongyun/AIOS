import { instantTaskJson } from "../../app_shared/instantTask.js";

const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const parseFinance = async (body = {}) => {
    const text = String(body.text || "").trim().slice(0, 500);
    if (!text) return { error: "请先输入要分析的文字", status: 400 };

    const today = todayISO();
    const prompt = [
        "你在帮一个记账应用解析口语化记账描述,把它转成结构化字段。",
        `今天是 ${today}。如果原文里没说日期,date 就用今天。`,
        "金额按人民币元处理。",
        "type 二选一:expense(支出) 或 income(收入)。判断规则:发工资 / 收到 / 转入 / 退款 / 报销 / 卖出 → income;其它默认 expense。",
        "note 是简短备注(不超过 30 字),不要重复金额数字,不要带 元 或 块 这种单位。",
        "",
        "原文:",
        text,
        "",
        '严格只返回这种 JSON,不要解释、不要 ```、不要任何前后说明:',
        '{"type":"expense","amount":25,"note":"三明治","date":"2026-05-02"}',
    ].join("\n");

    let parsed;
    try {
        parsed = await instantTaskJson({
            app: "finance",
            title: "分析记账",
            prompt,
            meta: { kind: "parse" },
        });
    } catch (err) {
        return { error: err.message || "AI 分析失败", status: 502 };
    }

    if (!parsed || typeof parsed !== "object") {
        return { error: "AI 返回格式不对", status: 502 };
    }

    const type = parsed.type === "income" ? "income" : "expense";
    const amount = Number(parsed.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { error: "未能识别金额", status: 422 };
    }
    const note = String(parsed.note || "").slice(0, 200).trim();
    const dateRaw = String(parsed.date || today).slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? dateRaw : today;

    return { type, amount, note, date };
};

export { parseFinance };
