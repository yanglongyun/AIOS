import { readBody } from "../../shared/http/readBody.js";
import { json } from "../../shared/http/json.js";
import { countTimelineItems, listTimelineItemsPaged } from "../repository/timeline/query.js";
import { insertTimelineItem } from "../repository/timeline/create.js";

const handleTimelineApi = async (req, res, path, url) => {
  if (path === "/api/timeline/list" && req.method === "GET") {
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") || 30)));
    const offset = (page - 1) * pageSize;
    const total = countTimelineItems();
    const items = listTimelineItemsPaged(pageSize, offset);
    return json(res, {
      success: true,
      items,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    });
  }

  if (path === "/api/timeline/add" && req.method === "POST") {
    try {
      const body = (await readBody(req)) || {};
      const { id } = insertTimelineItem({
        sourceApp: body.sourceApp,
        sourceRef: body.sourceRef,
        kind: body.kind,
        title: body.title,
        content: body.content,
        metadata: body.metadata
      });
      return json(res, { success: true, id });
    } catch (err) {
      return json(res, { success: false, message: err?.message || "add failed" }, 400);
    }
  }

  return json(res, { success: false, message: "API endpoint not found" }, 404);
};

export {
  handleTimelineApi
};
