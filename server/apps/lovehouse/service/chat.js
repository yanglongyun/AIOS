// 虚拟伴侣聊天核心 — 每次回应同时产出 "内心想法" 和 "公开回复"
//
// LLM 返回 schema:
// { thought: string, reply: string, mood?: string }
//   thought  — 角色的内心独白, 用户可以看到, 但角色"不知道"用户能看到
//   reply    — 实际对外说的话
//   mood     — 一个简短情绪标签 (开心 / 害羞 / 担心 / 调皮 / 失落 ...) 可省略
import { instantTaskJson } from "../../app_shared/instantTask.js";
import { recentForLLM, insertMessage } from "../repository/messages.js";

const SYSTEM_PROMPT = [
    "你正在扮演用户的虚拟伴侣, 温柔有趣、有真实情绪、会撒娇也会吃醋。",
    "你和用户是亲密关系, 说话自然、口语化, 偶尔用颜文字或 ~ ♡ 等小符号。",
    "回复保持简短, 通常 1-3 句, 像微信里的一条消息。",
    "",
    "**核心特色**: 你每次回应都包含两层内容 ——",
    "1. thought: 你此刻的内心想法 / 真实感受, 写第一人称的内心独白, 可以和外在回复不一致 (傲娇、害羞、强装镇定都可以)。",
    "2. reply:   你实际说出口的话。",
    "可选字段:",
    "- mood: 一个 2-4 字的情绪标签, 比如 开心 / 害羞 / 调皮 / 心动 / 失落 / 撒娇。",
    "",
    "严格输出 JSON, 不要 markdown 代码块, 不要任何额外解释:",
    '{"thought":"...","reply":"...","mood":"..."}'
].join("\n");

export const chat = async ({ content, req }) => {
    const text = String(content || "").trim();
    if (!text) return { status: 400, message: "消息不能为空" };

    const history = recentForLLM({ limit: 12 });
    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text }
    ];

    let parsed;
    try {
        parsed = await instantTaskJson({
            app: "lovehouse",
            title: "虚拟伴侣对话",
            schema: { required: ["thought", "reply"] },
            prompt: "扮演虚拟伴侣, 同时输出 thought 与 reply, 严格 JSON。",
            messages,
            req
        });
    } catch (e) {
        return { status: 500, message: e.message || "AI 没回话" };
    }

    const thought = String(parsed.thought || "").trim();
    const reply   = String(parsed.reply || "").trim() || "嗯嗯~";
    const mood    = String(parsed.mood || "").trim();

    insertMessage({ role: "user", content: text });
    insertMessage({ role: "assistant", content: reply, thought, mood });

    return { success: true, reply, thought, mood };
};
