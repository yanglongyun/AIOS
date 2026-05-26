import { json } from "../../../shared/http/json.js";
import { readBody } from "../../../shared/http/readBody.js";
import {
  listProjects, getProject, createProject, updateProject, deleteProject,
} from "../repository/projects.js";
import {
  listWorks, getWork, createWork, updateWork, deleteWork, clearProjectWorks,
} from "../repository/works.js";

const readId = (req, body = {}) => {
  if (body.id) return Number(body.id);
  const url = new URL(req.url, `http://${req.headers.host}`);
  return Number(url.searchParams.get("id") || 0);
};

const handleDemogenApi = async (req, res, path) => {
  // ── Projects ─────────────────────────────────────────────────────────────
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
    const project = createProject(body);
    return json(res, { success: true, project });
  }

  if (path === "/apps/demogen/project" && req.method === "PATCH") {
    const body = await readBody(req);
    const id = readId(req, body);
    if (!getProject(id)) return json(res, { success: false, message: "项目不存在" }, 404);
    const project = updateProject(id, body);
    return json(res, { success: true, project });
  }

  if (path === "/apps/demogen/project" && req.method === "DELETE") {
    const id = readId(req);
    if (!getProject(id)) return json(res, { success: false, message: "项目不存在" }, 404);
    deleteProject(id);
    return json(res, { success: true });
  }

  // ── Plans: save generated works to DB ─────────────────────────────────────
  if (path === "/apps/demogen/project/plans" && req.method === "POST") {
    const body = await readBody(req);
    const project = getProject(Number(body.project_id || 0));
    if (!project) return json(res, { success: false, message: "项目不存在" }, 404);
    const plans = Array.isArray(body.plans) ? body.plans : [];
    if (!plans.length) return json(res, { success: false, message: "plans 不能为空" }, 400);
    const batch = String(body.batch || "");
    // clear existing idle works
    clearProjectWorks(project.id);
    const works = plans.map(plan =>
      createWork({
        project_id: project.id,
        plan_id: String(plan.id || ""),
        name: String(plan.name || "").trim(),
        angle: String(plan.angle || ""),
        audience: String(plan.audience || ""),
        layout: String(plan.layout || ""),
        interactions: Array.isArray(plan.interactions) ? plan.interactions : [],
        files: Array.isArray(plan.files) ? plan.files : ["index.html"],
        batch,
      })
    );
    updateProject(project.id, { status: "planned" });
    return json(res, { success: true, works });
  }

  // ── Works ─────────────────────────────────────────────────────────────────
  if (path === "/apps/demogen/work" && req.method === "GET") {
    const id = readId(req);
    const work = getWork(id);
    if (!work) return json(res, { success: false, message: "作品不存在" }, 404);
    return json(res, { success: true, work });
  }

  if (path === "/apps/demogen/work/launch" && req.method === "POST") {
    const body = await readBody(req);
    const work = getWork(Number(body.work_id || 0));
    if (!work) return json(res, { success: false, message: "作品不存在" }, 404);
    const updated = updateWork(work.id, {
      task_id: Number(body.task_id) || null,
      batch: String(body.batch || work.batch || ""),
      status: "running",
    });
    return json(res, { success: true, work: updated });
  }

  if (path === "/apps/demogen/work/status" && req.method === "PATCH") {
    const body = await readBody(req);
    const work = getWork(Number(body.id || 0));
    if (!work) return json(res, { success: false, message: "作品不存在" }, 404);
    const allowed = ["idle", "running", "done", "error", "aborted"];
    const status = allowed.includes(body.status) ? body.status : null;
    if (!status) return json(res, { success: false, message: "非法状态值" }, 400);
    const updated = updateWork(work.id, { status });
    return json(res, { success: true, work: updated });
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
