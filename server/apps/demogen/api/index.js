import { json } from "../../../shared/http/json.js";
import { readBody } from "../../../shared/http/readBody.js";
import {
  listProjects, getProject, createProject, updateProject, deleteProject,
} from "../repository/projects.js";
import { listWorks, getWork, deleteWork } from "../repository/works.js";
import {
  generatePlans, buildWork, buildAll, iterateWork, resolveWork,
} from "../service/generate.js";

const readId = (req, body = {}) => {
  if (body.id) return Number(body.id);
  const url = new URL(req.url, `http://${req.headers.host}`);
  return Number(url.searchParams.get("id") || 0);
};

const handleDemogenApi = async (req, res, path) => {
  // ── Projects ───────────────────────────────────────────────────────────────
  if (path === "/apps/demogen/projects" && req.method === "GET") {
    return json(res, { success: true, projects: listProjects() });
  }

  if (path === "/apps/demogen/project" && req.method === "GET") {
    const id = readId(req);
    const project = getProject(id);
    if (!project) return json(res, { success: false, message: "项目不存在" }, 404);
    return json(res, { success: true, project, works: listWorks(id) });
  }

  if (path === "/apps/demogen/project" && req.method === "POST") {
    const body = await readBody(req);
    if (!String(body.feature || "").trim())
      return json(res, { success: false, message: "feature 不能为空" }, 400);
    return json(res, { success: true, project: createProject(body) });
  }

  if (path === "/apps/demogen/project" && req.method === "PATCH") {
    const body = await readBody(req);
    const id = readId(req, body);
    if (!getProject(id)) return json(res, { success: false, message: "项目不存在" }, 404);
    return json(res, { success: true, project: updateProject(id, body) });
  }

  if (path === "/apps/demogen/project" && req.method === "DELETE") {
    const id = readId(req);
    if (!getProject(id)) return json(res, { success: false, message: "项目不存在" }, 404);
    deleteProject(id);
    return json(res, { success: true });
  }

  // ── Generation ─────────────────────────────────────────────────────────────
  if (path === "/apps/demogen/project/plan" && req.method === "POST") {
    const body = await readBody(req);
    const works = await generatePlans(readId(req, body));
    return json(res, { success: true, works });
  }

  if (path === "/apps/demogen/project/build" && req.method === "POST") {
    const body = await readBody(req);
    const works = await buildAll(readId(req, body));
    return json(res, { success: true, works });
  }

  // ── Works ──────────────────────────────────────────────────────────────────
  if (path === "/apps/demogen/work" && req.method === "GET") {
    const work = getWork(readId(req));
    if (!work) return json(res, { success: false, message: "作品不存在" }, 404);
    return json(res, { success: true, work });
  }

  if (path === "/apps/demogen/work/build" && req.method === "POST") {
    const body = await readBody(req);
    const work = await buildWork(Number(body.id || 0));
    return json(res, { success: true, work });
  }

  if (path === "/apps/demogen/work/iterate" && req.method === "POST") {
    const body = await readBody(req);
    const work = await iterateWork(Number(body.id || 0), body.instruction);
    return json(res, { success: true, work });
  }

  if (path === "/apps/demogen/work/resolve" && req.method === "POST") {
    const body = await readBody(req);
    const work = resolveWork(Number(body.id || 0), String(body.status || ""));
    return json(res, { success: true, work });
  }

  if (path === "/apps/demogen/work" && req.method === "DELETE") {
    const id = readId(req);
    if (!getWork(id)) return json(res, { success: false, message: "作品不存在" }, 404);
    deleteWork(id);
    return json(res, { success: true });
  }

  return false;
};

export { handleDemogenApi };
