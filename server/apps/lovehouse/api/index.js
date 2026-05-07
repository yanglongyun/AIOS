import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { listMessages } from "../repository/messages.js";
import { chat } from "../service/chat.js";

const reply = (res, data) => {
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
};

export const handleLovehouseApi = async (req, res, path) => {
    if (req.method === "GET" && path === "/apps/lovehouse/messages") {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const limit = Number(url.searchParams.get("limit") || 100);
        return json(res, { items: listMessages({ limit }) });
    }

    if (req.method === "POST" && path === "/apps/lovehouse/chat") {
        const body = await readBody(req);
        return reply(res, await chat({ ...body, req }));
    }

    return false;
};
