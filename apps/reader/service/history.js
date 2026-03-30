import { parseJson } from "../../../shared/json/parse.js";
import { findSessionWithChapters } from "../repository/history.js";
const history = ({ sessionId }) => {
  const id = Number(sessionId);
  if (!Number.isInteger(id) || id <= 0) return { status: 400, message: "sessionId \u65E0\u6548" };
  const result = findSessionWithChapters(id);
  if (!result) return { status: 404, message: "\u6545\u4E8B\u4E0D\u5B58\u5728" };
  const { session, chapters } = result;
  return {
    success: true,
    session: {
      id: session.id,
      title: session.title,
      premise: session.premise || "",
      summary: session.summary || "",
      progress: session.progress || "",
      chapterCount: session.chapter_count || 0,
      createdAt: session.created_at,
      updatedAt: session.updated_at
    },
    chapters: chapters.map((c) => ({
      id: c.id,
      idx: c.idx,
      action: c.action || "",
      content: c.content || "",
      choices: parseJson(c.choices_json, `reader_chapters.choices_json#${c.id}`),
      summary: c.summary || "",
      progress: c.progress || "",
      createdAt: c.created_at
    }))
  };
};
export {
  history
};
