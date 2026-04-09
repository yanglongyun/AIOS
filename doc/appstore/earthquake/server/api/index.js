import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { list } from "../service/list.js";
import { analyze } from "../service/analyze.js";

const handleEarthquakeApi = async (req, res, path) => {
  if (path === "/apps/earthquake/list" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const minMag = Number(url.searchParams.get("minMagnitude") || 2.5);
    const days = Number(url.searchParams.get("days") || 7);
    const data = await list({ minMagnitude: minMag, days });
    return json(res, data);
  }
  if (path === "/apps/earthquake/analyze" && req.method === "POST") {
    const body = await readBody(req);
    const data = await analyze(body);
    return json(res, data);
  }
  return false;
};

export { handleEarthquakeApi };
