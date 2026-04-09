import { readBody } from "../../../shared/http/readBody.js";
import { json } from "../../../shared/http/json.js";
import { generate } from "../service/generate.js";
import { saveNode, getNode, listNodes } from "../repository/nodes.js";
import { addFavorite, removeFavorite, listFavorites } from "../repository/favorites.js";
import { randomUUID } from "crypto";

const handleWikitreeApi = async (req, res, path) => {
  if (path === "/apps/wikitree/generate" && req.method === "POST") {
    const body = await readBody(req);
    const { title, parentId, trace, locale, currentContent } = body;
    const data = await generate({ title, trace, locale, currentContent });
    const id = randomUUID();
    saveNode({ id, parentId, title, content: data.content });
    return json(res, { success: true, node: { id, parent_id: parentId, title, content: data.content } });
  }
  if (path === "/apps/wikitree/node" && req.method === "GET") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");
    const node = getNode(id);
    return json(res, { success: true, node });
  }
  if (path === "/apps/wikitree/list" && req.method === "GET") {
    return json(res, { success: true, nodes: listNodes() });
  }
  if (path === "/apps/wikitree/favorites" && req.method === "GET") {
    return json(res, { success: true, favorites: listFavorites() });
  }
  if (path === "/apps/wikitree/favorite" && req.method === "POST") {
    const body = await readBody(req);
    const { nodeId, title } = body;
    const id = randomUUID();
    addFavorite({ id, nodeId, title });
    return json(res, { success: true, id });
  }
  if (path === "/apps/wikitree/favorite" && req.method === "DELETE") {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = url.searchParams.get("id");
    removeFavorite(id);
    return json(res, { success: true });
  }
  return false;
};

export { handleWikitreeApi };
