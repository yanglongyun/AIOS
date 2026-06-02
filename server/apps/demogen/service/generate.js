import { existsSync, readdirSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { instantTaskJson } from "../../_shared/task/instantTask.js";
import { agentTaskStart } from "../../_shared/task/agentTask.js";
import { getProject, updateProject } from "../repository/projects.js";
import {
  clearProjectWorks, createWork, getWork, listWorks, updateWork,
} from "../repository/works.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../..");
const EXPORTS_REL = "files/exports/demogen";

const safeName = (v) =>
  String(v ?? "").trim().toLowerCase()
    .replace(/[^a-z0-9一-龥]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "demo";

const batchId = () => new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

const clampCount = (n) => Math.max(1, Math.min(10, Math.round(Number(n) || 4)));

// 相对仓库根的目录（agent 写文件用），以及对应的绝对路径（预览/扫描用）。
const workRelDir = (project, work) =>
  `${EXPORTS_REL}/${safeName(project.feature)}-${work.batch}/${safeName(work.plan_id)}`;

const workAbsDir = (project, work) => join(ROOT, workRelDir(project, work));

const planPrompt = (project, count) => `请围绕同一个功能，设计 ${count} 套差异明显、各有侧重的前端 Demo 方案。

功能需求：${project.feature}
技术栈：${project.stack}
约束：${project.constraints || "无"}

要求：
- ${count} 套方案在产品角度、视觉风格、交互重点上要彼此明显不同，便于横向对比。
- 每套方案配 2-4 个一句话亮点（highlights）。

只返回 JSON，不要任何 Markdown 包裹或解释：
{
  "plans": [
    {
      "id": "demo-1",
      "name": "方案名称（简短）",
      "angle": "这套方案的核心方向（一句话）",
      "highlights": ["亮点1", "亮点2"]
    }
  ]
}`;

const buildPrompt = (project, work, relDir) => `请实现一套真实、可直接在浏览器打开运行的前端 Demo。

原始功能：${project.feature}
技术栈与约束：
${project.stack}
${project.constraints || ""}

本方案：
- 名称：${work.name}
- 方向：${work.angle}
- 亮点：${(work.highlights || []).join("、") || "（无）"}

硬性输出要求：
- 只产出一个文件：${relDir}/index.html
- 必须是单文件：CSS 写进 <style>，JS 写进 <script>，不要外链本地 js/css/图片资源（可用 CDN 或内联 SVG/DataURL）。
- 内容要真实完整、可交互，不要任何占位符或 “TODO”。
- 严格围绕本方案的方向，不要混入其它方案的风格。
- 完成后只需用一句话说明产物路径。`;

const iteratePrompt = (project, work, relDir, instruction) => `继续修改下面这套已生成的 Demo。

产物文件：${relDir}/index.html
原始功能：${project.feature}
本方案方向：${work.angle}

用户的修改要求：
${instruction}

要求：
- 直接读取并在原 index.html 上修改，保持单文件结构（内联 CSS/JS）。
- 保留与本方案方向一致的整体风格，只按要求调整。
- 完成后用一句话说明改了什么。`;

const normalizePlans = (value, count) => {
  const list = Array.isArray(value?.plans) ? value.plans
    : Array.isArray(value?.demos) ? value.demos : [];
  if (!list.length) throw new Error("方案结果缺少 plans 字段");
  return list.slice(0, clampCount(count)).map((item, i) => ({
    id: String(item.id || `demo-${i + 1}`),
    name: String(item.name || item.title || `方案 ${i + 1}`).trim(),
    angle: String(item.angle || item.concept || item.summary || "").trim(),
    highlights: Array.isArray(item.highlights)
      ? item.highlights.map(String).filter(Boolean).slice(0, 4)
      : [],
  }));
};

const generatePlans = async (projectId) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");
  const count = clampCount(project.plan_count);

  const result = await instantTaskJson({
    app: "demogen",
    title: `生成方案：${project.feature}`.slice(0, 80),
    meta: { type: "plan", project_id: project.id },
    payload: {
      messages: [
        { role: "system", content: "你是产品原型与前端 Demo 总监，擅长把同一个功能拆成多个风格清晰、差异明显的方向。只输出严格 JSON。" },
        { role: "user", content: planPrompt(project, count) },
      ],
    },
  });

  const plans = normalizePlans(result, count);
  const batch = batchId();
  clearProjectWorks(project.id);
  plans.forEach((plan) => createWork({
    project_id: project.id,
    plan_id: plan.id,
    name: plan.name,
    angle: plan.angle,
    highlights: plan.highlights,
    batch,
  }));
  updateProject(project.id, { status: "planned" });
  return listWorks(project.id);
};

const buildWork = async (workId) => {
  const work = getWork(workId);
  if (!work) throw new Error("作品不存在");
  const project = getProject(work.project_id);
  if (!project) throw new Error("项目不存在");

  const batch = work.batch || batchId();
  const relDir = workRelDir(project, { ...work, batch });
  const absDir = join(ROOT, relDir);

  const task = await agentTaskStart({
    app: "demogen",
    title: `${project.feature} · ${work.name}`.slice(0, 90),
    meta: { type: "demo", project_id: project.id, work_id: work.id, batch },
    payload: {
      messages: [
        { role: "system", content: "你是资深前端原型工程师，擅长用单文件 HTML/CSS/JS 生成真实可运行的 Demo。" },
        { role: "user", content: buildPrompt(project, { ...work, batch }, relDir) },
      ],
    },
  });

  return updateWork(work.id, {
    task_id: Number(task.id) || null,
    batch,
    dir_path: absDir,
    entry_path: "",
    error: "",
    status: "running",
  });
};

const buildAll = async (projectId) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");
  const targets = listWorks(project.id).filter((w) => w.status !== "running" && w.status !== "done");
  for (const w of targets) await buildWork(w.id);
  return listWorks(project.id);
};

const iterateWork = async (workId, instruction) => {
  const text = String(instruction || "").trim();
  if (!text) throw new Error("修改要求不能为空");
  const work = getWork(workId);
  if (!work) throw new Error("作品不存在");
  const project = getProject(work.project_id);
  if (!project) throw new Error("项目不存在");
  if (!work.dir_path) throw new Error("该作品尚未生成，无法修改");

  const relDir = workRelDir(project, work);
  const task = await agentTaskStart({
    app: "demogen",
    title: `改稿 · ${work.name}`.slice(0, 90),
    meta: { type: "iterate", project_id: project.id, work_id: work.id, batch: work.batch },
    payload: {
      messages: [
        { role: "system", content: "你是资深前端原型工程师，擅长在已有单文件 Demo 上做精准修改。" },
        { role: "user", content: iteratePrompt(project, work, relDir, text) },
      ],
    },
  });

  return updateWork(work.id, {
    task_id: Number(task.id) || null,
    entry_path: "",
    error: "",
    status: "running",
  });
};

// 任务跑完后，扫描产物目录定位入口 html，落库 entry_path 并标记完成。
const findEntryHtml = (absDir) => {
  if (!absDir || !existsSync(absDir)) return "";
  const index = join(absDir, "index.html");
  if (existsSync(index)) return index;
  try {
    const html = readdirSync(absDir)
      .filter((f) => f.toLowerCase().endsWith(".html"))
      .map((f) => join(absDir, f))
      .filter((p) => statSync(p).isFile());
    return html[0] || "";
  } catch {
    return "";
  }
};

const resolveWork = (workId, status) => {
  const work = getWork(workId);
  if (!work) throw new Error("作品不存在");

  // 仅在任务真正结束（done/error/aborted）时定位产物。
  if (status === "running" || status === "pending") {
    return updateWork(work.id, { status: "running" });
  }

  const entry = findEntryHtml(work.dir_path);
  if (entry) {
    return updateWork(work.id, { entry_path: entry, status: "done", error: "" });
  }
  return updateWork(work.id, {
    status: status === "aborted" ? "aborted" : "error",
    error: status === "aborted" ? "已中止" : "未找到产物 index.html",
  });
};

export { generatePlans, buildWork, buildAll, iterateWork, resolveWork };
