import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { list } from "../service/list.js";
import { analyze } from "../service/analyze.js";

const handleGhtrendingApi = async (req, res, path) => {
  if (path === "/apps/ghtrending/list" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const language = url.searchParams.get("language") || "";
    const since = url.searchParams.get("since") || "daily";
    const data = await list({ language, since });
    return json(res, data);
  }
  if (path === "/apps/ghtrending/analyze" && req.method === "POST") {
    const body = await readBody(req);
    const data = await analyze(body);
    return json(res, data);
  }
  return false;
};

export { handleGhtrendingApi };
