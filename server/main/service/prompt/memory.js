import { listMemoriesForPrompt } from "../../repository/memory.js";

const trim = (value, max) => String(value || "").trim().slice(0, max);

// 按 visibility 三档注入「记忆」:
//   count   只露条目总数,让助理知道"用户写了 N 条但选择不展开"
//   summary 露标题 + 描述,内容隐藏
//   full    全部注入(标题 + 描述 + 内容)
// 三档可并存。仅有 count 时也输出一行计数说明。
const memory = () => {
    const { total, summary, full } = listMemoriesForPrompt();
    if (!total) return "";

    const sections = [];

    if (full.length) {
        const lines = full.map((m) => {
            const title = trim(m.title, 120) || `记忆 #${m.id}`;
            const desc  = trim(m.description, 400);
            const body  = trim(m.content, 4000);
            return [
                `### ${title}`,
                desc ? `摘要：${desc}` : "",
                body ? `内容：\n${body}` : ""
            ].filter(Boolean).join("\n");
        });
        sections.push(`### 完整记忆（${full.length} 条）\n${lines.join("\n\n")}`);
    }

    if (summary.length) {
        const lines = summary.map((m) => {
            const title = trim(m.title, 120) || `记忆 #${m.id}`;
            const desc  = trim(m.description, 400);
            return desc ? `- **${title}** —— ${desc}` : `- **${title}**`;
        });
        sections.push(`### 仅摘要（${summary.length} 条，内容不可见）\n${lines.join("\n")}`);
    }

    const hidden = total - full.length - summary.length;
    if (hidden > 0) {
        sections.push(`### 仅可见数量\n用户另有 ${hidden} 条记忆未对你开放，你只知道它们存在。`);
    }

    return `\n\n## 用户记忆\n用户写给你的长期上下文，按可见性分档展示：\n\n${sections.join("\n\n")}`;
};

export {
    memory
};
