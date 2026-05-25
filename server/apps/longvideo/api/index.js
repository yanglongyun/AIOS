import { json } from "../../../shared/http/json.js";
import { readBody } from "../../../shared/http/readBody.js";
import { createProject, getProject, listProjects } from "../repository/projects.js";
import { getPublicProviderSettings, saveProviderSettings } from "../repository/settings.js";
import { createAudioJob, createImageJob } from "../providers/volcengine.js";
import { assembleVideo, queueAssets } from "../service/assets.js";
import { generatePlan } from "../service/planner.js";

const readProjectId = (req, body = {}) => {
  if (body.id) return Number(body.id);
  const url = new URL(req.url, `http://${req.headers.host}`);
  return Number(url.searchParams.get("id") || 0);
};

const handleLongvideoApi = async (req, res, path) => {
  if (path === "/apps/longvideo/projects" && req.method === "GET") {
    return json(res, { success: true, projects: listProjects() });
  }

  if (path === "/apps/longvideo/settings" && req.method === "GET") {
    return json(res, { success: true, settings: getPublicProviderSettings() });
  }

  if (path === "/apps/longvideo/settings" && req.method === "POST") {
    const body = await readBody(req);
    return json(res, { success: true, settings: saveProviderSettings(body) });
  }

  if (path === "/apps/longvideo/settings/test-image" && req.method === "POST") {
    const result = await createImageJob({ prompt: "测试图片生成：一盏放在书桌上的白色台灯，干净背景，自然光，写实风格" });
    if (result?.ok === false) return json(res, { success: false, message: result.message, result }, 400);
    return json(res, { success: true, result });
  }

  if (path === "/apps/longvideo/settings/test-audio" && req.method === "POST") {
    const result = await createAudioJob({
      projectId: "settings-test",
      segmentId: "audio",
      text: "这是视频工坊的语音生成测试。当前语音服务已经可以连接。",
    });
    if (result?.ok === false) return json(res, { success: false, message: result.message, result }, 400);
    return json(res, { success: true, result });
  }

  if (path === "/apps/longvideo/project" && req.method === "GET") {
    const id = readProjectId(req);
    const project = getProject(id);
    if (!project) return json(res, { success: false, message: "项目不存在" }, 404);
    return json(res, { success: true, project });
  }

  if (path === "/apps/longvideo/project" && req.method === "POST") {
    const body = await readBody(req);
    if (!String(body.prompt || "").trim()) {
      return json(res, { success: false, message: "描述不能为空" }, 400);
    }
    const project = createProject({
      title: body.title,
      prompt: body.prompt,
    });
    return json(res, { success: true, project });
  }

  if (path === "/apps/longvideo/project/generate-plan" && req.method === "POST") {
    const body = await readBody(req);
    const project = await generatePlan({ projectId: readProjectId(req, body) });
    return json(res, { success: true, project });
  }

  if (path === "/apps/longvideo/project/generate-assets" && req.method === "POST") {
    const body = await readBody(req);
    const project = await queueAssets({ projectId: readProjectId(req, body) });
    return json(res, { success: true, project });
  }

  if (path === "/apps/longvideo/project/assemble" && req.method === "POST") {
    const body = await readBody(req);
    const project = await assembleVideo({ projectId: readProjectId(req, body) });
    return json(res, { success: true, project });
  }

  return false;
};

export {
  handleLongvideoApi,
};
