import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { list } from "../service/list.js";
import { detail } from "../service/detail.js";
import { analyze } from "../service/analyze.js";

const handleCoinmarketApi = async (req, res, path) => {
  if (path === "/apps/coinmarket/list" && req.method === "GET") {
    const data = await list();
    return json(res, data);
  }
  if (path === "/apps/coinmarket/detail" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id") || "";
    const data = await detail({ id });
    if (data?.status) return json(res, { success: false, message: data.message }, data.status);
    return json(res, data);
  }
  if (path === "/apps/coinmarket/analyze" && req.method === "POST") {
    const body = await readBody(req);
    const data = await analyze(body);
    return json(res, data);
  }
  return false;
};

export { handleCoinmarketApi };
