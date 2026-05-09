import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { generate } from "../service/generation.js";
import { getProgress } from "../service/progress.js";

const handleBananaApi = async (req, res, path) => {
  if (path === "/apps/banana/generation" && req.method === "POST") {
    const body = await readBody(req);
    const { history, now, choices, next, prompt, messages, taskTitle } = body;
    if (!now && !next) return json(res, { success: false, message: "Missing required parameters" }, 400);

    let data = null;
    try {
      data = await generate({ history, now, choices, next, prompt, messages, taskTitle, req });
    } catch (error) {
      console.error("[banana.api] generate 抛异常:", error);
      data = { status: 500, message: error.message || "generation failed", stack: error.stack };
    }

    if (data?.status) {
      // 把 raw / parsed / stack 透传给前端,前端 console 能直接看到 AI 真实输出
      return json(
        res,
        {
          success: false,
          message: data.message,
          raw: data.raw,
          parsed: data.parsed,
          stack: data.stack
        },
        data.status
      );
    }
    return json(res, data);
  }

  if (path === "/apps/banana/progress" && req.method === "GET") {
    return json(res, getProgress());
  }

  return false;
};

export { handleBananaApi };
