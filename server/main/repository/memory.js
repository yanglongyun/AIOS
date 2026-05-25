// 「记忆」是用户写给 AI 看的长期上下文条目。
// visibility 三档(详见 service/prompt/memory.js):
//   count    只让助理知道"有 N 条记忆"
//   summary  注入标题 + 描述,内容隐藏
//   full     全部注入(标题 + 描述 + 内容)
import { db } from "./client.js";

const VISIBILITIES = ["count", "summary", "full"];

const rowToMemory = (row) => row && {
    id: row.id,
    title: row.title || "",
    description: row.description || "",
    content: row.content || "",
    visibility: row.visibility || "full",
    starred: Number(row.starred || 0) === 1,
    created_at: row.created_at || null
};

const normVisibility = (v) =>
    VISIBILITIES.includes(String(v)) ? String(v) : "full";

const listMemories = () => {
    const rows = db.prepare(`
        SELECT id, title, description, content, visibility, starred, created_at
        FROM memories
        ORDER BY starred DESC, id DESC
    `).all();
    return rows.map(rowToMemory);
};

// 仅供 prompt 注入。按可见性分组,内容只在 full 档返回。
// count 档不返回任何字段,只算进 total。
const listMemoriesForPrompt = () => {
    const rows = db.prepare(`
        SELECT id, title, description, content, visibility, starred
        FROM memories
        ORDER BY id ASC
    `).all();
    return {
        total: rows.length,
        summary: rows
            .filter((r) => r.visibility === "summary")
            .map((r) => ({ id: r.id, title: r.title || "", description: r.description || "" })),
        full: rows
            .filter((r) => r.visibility === "full")
            .map((r) => ({
                id: r.id,
                title: r.title || "",
                description: r.description || "",
                content: r.content || ""
            }))
    };
};

const getMemory = (id) => {
    const row = db.prepare(
        "SELECT id, title, description, content, visibility, starred, created_at FROM memories WHERE id = ?"
    ).get(Number(id) || 0);
    return rowToMemory(row);
};

const createMemory = ({ title, description = "", content, visibility = "full", starred = false }) => {
    const ret = db.prepare(`
        INSERT INTO memories (title, description, content, visibility, starred)
        VALUES (?, ?, ?, ?, ?)
    `).run(
        String(title || "").trim(),
        String(description || "").trim(),
        String(content || "").trim(),
        normVisibility(visibility),
        starred ? 1 : 0
    );
    return getMemory(Number(ret.lastInsertRowid));
};

const updateMemory = (id, patch = {}) => {
    const fields = [];
    const values = [];
    if (patch.title !== undefined) { fields.push("title = ?"); values.push(String(patch.title).trim()); }
    if (patch.description !== undefined) { fields.push("description = ?"); values.push(String(patch.description).trim()); }
    if (patch.content !== undefined) { fields.push("content = ?"); values.push(String(patch.content).trim()); }
    if (patch.visibility !== undefined) { fields.push("visibility = ?"); values.push(normVisibility(patch.visibility)); }
    if (patch.starred !== undefined) { fields.push("starred = ?"); values.push(patch.starred ? 1 : 0); }
    if (!fields.length) return getMemory(id);
    values.push(Number(id) || 0);
    db.prepare(`UPDATE memories SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return getMemory(id);
};

const deleteMemory = (id) => {
    db.prepare("DELETE FROM memories WHERE id = ?").run(Number(id) || 0);
    return { success: true };
};

export { listMemories, listMemoriesForPrompt, getMemory, createMemory, updateMemory, deleteMemory, VISIBILITIES };
