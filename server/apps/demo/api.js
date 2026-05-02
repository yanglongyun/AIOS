import { json } from "../../shared/http/json.js";
import { listDemos, getDemoBySlug } from "./repository.js";

const handleDemoApi = async (req, res, path) => {
    if (path === "/apps/demo/list" && req.method === "GET") {
        return json(res, { items: listDemos() });
    }
    if (path === "/apps/demo/get" && req.method === "GET") {
        const url = new URL(req.url, "http://x");
        const slug = url.searchParams.get("slug");
        if (!slug) return json(res, { error: "missing slug" }, 400);
        const row = getDemoBySlug(slug);
        if (!row) return json(res, { error: "not found" }, 404);
        return json(res, {
            id:          row.id,
            slug:        row.slug,
            title:       row.title,
            description: row.description || "",
            html:        row.html,
            createdAt:   row.created_at,
            updatedAt:   row.updated_at,
        });
    }
    return false;
};

export { handleDemoApi };
