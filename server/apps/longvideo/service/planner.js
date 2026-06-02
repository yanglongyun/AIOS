import { createInstantJsonTask } from "../../../main/service/task/create.js";
import { parseJson } from "../../../shared/json/parse.js";
import { getProject, updateProjectPlan } from "../repository/projects.js";
import { getRawProviderSettings } from "../repository/settings.js";

const extractJson = (text) => {
  const raw = String(text || "").trim();
  if (!raw) throw new Error("AI 未返回规划内容");
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("AI 返回内容不是 JSON");
  }
  return parseJson(body.slice(start, end + 1), "longvideo.plan");
};

const normalizeSegments = (items) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) throw new Error("规划结果缺少 segments");
  return list.map((item, index) => ({
    index: index + 1,
    title: String(item.title || `第 ${index + 1} 段`).trim(),
    durationSec: Math.max(20, Number(item.durationSec || item.duration_sec || 180) || 180),
    narration: String(item.narration || "").trim(),
    imagePrompt: String(item.imagePrompt || item.image_prompt || "").trim(),
  })).filter((item) => item.narration && item.imagePrompt);
};

const fillTemplate = (template, values) => {
  return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => {
    return String(values[key] ?? "");
  });
};

const generatePlan = async ({ projectId }) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");
  const settings = getRawProviderSettings();

  const prompt = fillTemplate(settings.planPromptTemplate, {
    title: project.title,
    prompt: project.prompt,
  });

  const task = await createInstantJsonTask({
    app: "longvideo",
    title: `生成视频方案: ${project.title}`,
    meta: { projectId: project.id },
    payload: {
      messages: [
        { role: "system", content: "你只输出严格 JSON。" },
        { role: "user", content: prompt },
      ],
    },
  });

  if (!task?.response) {
    throw new Error("生成方案失败");
  }

  const outline = extractJson(task.response);
  const segments = normalizeSegments(outline.segments);
  return updateProjectPlan({ id: project.id, outline, segments });
};

export {
  generatePlan,
};
