import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { divine } from "../service/divine.js";
import { list } from "../service/list.js";
const handleFortuneApi = async (req, res, path) => {
  if (path === "/apps/fortune/divine" && req.method === "POST") {
    const body = await readBody(req);
    const question = String(body.question || "").trim();
    if (!question) return json(res, { success: false, message: "\u8BF7\u8F93\u5165\u4F60\u7684\u95EE\u9898" }, 400);
    const hexagram = String(body.hexagram || "").trim();
    const prompt = String(body.prompt || "").trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const taskTitle = String(body.taskTitle || "").trim();
    let data = null;
    try {
      data = await divine({ question, hexagram, prompt, messages, taskTitle, req });
    } catch (e) {
      data = { status: 500, message: e.message || "\u5360\u535C\u5931\u8D25" };
    }
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/apps/fortune/list" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return json(res, list({
      page: url.searchParams.get("page"),
      pageSize: url.searchParams.get("pageSize")
    }));
  }
  return false;
};
export {
  handleFortuneApi
};
