import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { list } from "../service/list.js";
import { review } from "../service/review.js";

const handleProducthuntApi = async (req, res, path) => {
  if (path === "/apps/producthunt/list" && req.method === "GET") {
    const data = await list();
    return json(res, data);
  }
  if (path === "/apps/producthunt/review" && req.method === "POST") {
    const body = await readBody(req);
    const data = await review(body);
    return json(res, data);
  }
  return false;
};

export { handleProducthuntApi };
