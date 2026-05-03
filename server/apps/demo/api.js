import { json } from "../../shared/http/json.js";
import { readBody } from "../../shared/http/readBody.js";
import {
    createProject, listAllProjects, getProjectDetail,
    regeneratePlan, removeProject, getResult,
} from "./service.js";

const handleDemoApi = async (req, res, path) => {
    if (path === "/apps/demo/project/list" && req.method === "GET") {
        return json(res, { items: listAllProjects() });
    }
    if (path === "/apps/demo/project/get" && req.method === "GET") {
        const url = new URL(req.url, "http://x");
        const id = Number(url.searchParams.get("id"));
        const detail = getProjectDetail(id);
        if (!detail) return json(res, { error: "not found" }, 404);
        return json(res, detail);
    }
    if (path === "/apps/demo/project/create" && req.method === "POST") {
        const body = await readBody(req);
        const result = await createProject(body);
        if (result?.error) return json(res, { error: result.error }, result.status || 400);
        return json(res, result);
    }
    if (path === "/apps/demo/project/delete" && req.method === "POST") {
        const body = await readBody(req);
        const result = removeProject(body);
        if (result?.error) return json(res, { error: result.error }, result.status || 400);
        return json(res, result);
    }
    if (path === "/apps/demo/plan/regenerate" && req.method === "POST") {
        const body = await readBody(req);
        const result = regeneratePlan(body);
        if (result?.error) return json(res, { error: result.error }, result.status || 400);
        return json(res, result);
    }
    if (path === "/apps/demo/result/get" && req.method === "GET") {
        const url = new URL(req.url, "http://x");
        const planId = url.searchParams.get("planId");
        const taskId = url.searchParams.get("taskId");
        const result = getResult({ planId, taskId });
        if (!result) return json(res, { error: "not found" }, 404);
        return json(res, result);
    }
    return false;
};

export { handleDemoApi };
