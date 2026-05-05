import { json } from "../../../shared/http/json.js";
import { listIdeas } from "../repository/ideas.js";

const handleWorkshopApi = async (req, res, path) => {
  if (path === "/apps/workshop/ideas" && req.method === "GET") {
    json(res, { success: true, items: listIdeas() });
    return true;
  }
  return false;
};

export {
  handleWorkshopApi
};
