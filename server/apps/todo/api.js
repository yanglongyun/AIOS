import { readBody } from "../../shared/http/readBody.js";
import { json }     from "../../shared/http/json.js";
import * as svc     from "./service.js";

const respond = (res, result) => {
    if (result?.error) return json(res, { error: result.error }, result.status || 400);
    return json(res, result);
};

const handleTodoApi = async (req, res, path) => {
    if (path === "/apps/todo/list" && req.method === "GET") {
        return json(res, svc.list());
    }
    if (path === "/apps/todo/create" && req.method === "POST") {
        return respond(res, svc.create(await readBody(req)));
    }
    if (path === "/apps/todo/update" && req.method === "POST") {
        return respond(res, svc.update(await readBody(req)));
    }
    if (path === "/apps/todo/delete" && req.method === "POST") {
        return respond(res, svc.remove(await readBody(req)));
    }
    if (path === "/apps/todo/run" && req.method === "POST") {
        return respond(res, await svc.run(await readBody(req)));
    }
    if (path === "/apps/todo/decompose" && req.method === "POST") {
        return respond(res, await svc.decompose(await readBody(req)));
    }
    if (path === "/apps/todo/update-task-status" && req.method === "POST") {
        return respond(res, svc.updateTaskStatus(await readBody(req)));
    }
    return false;
};

export { handleTodoApi };
