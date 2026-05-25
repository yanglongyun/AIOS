import { createInstantTask } from "../../../main/service/task/create.js";
import { parseJson } from "../../../shared/json/parse.js";
import { getProject, updateProjectPlan } from "../repository/projects.js";

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

const normalizeSegments = (items, durationMin) => {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) throw new Error("规划结果缺少 segments");
  const fallbackDuration = Math.max(60, Math.round((Number(durationMin) || 60) * 60 / list.length));
  return list.map((item, index) => ({
    index: index + 1,
    title: String(item.title || `第 ${index + 1} 段`).trim(),
    durationSec: Math.max(20, Number(item.durationSec || item.duration_sec || fallbackDuration) || fallbackDuration),
    narration: String(item.narration || "").trim(),
    imagePrompt: String(item.imagePrompt || item.image_prompt || "").trim(),
  })).filter((item) => item.narration && item.imagePrompt);
};

const generatePlan = async ({ projectId }) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");

  const prompt = `
你是长视频总编导。请为一个 ${project.durationMin} 分钟左右的中文长视频生成可执行制作方案。

主题: ${project.topic}
标题: ${project.title}
受众: ${project.audience || "泛知识内容观众"}
风格: ${project.style || "平实、克制、有结构"}

请只返回 JSON,不要解释。结构:
{
  "title": "视频标题",
  "summary": "整体叙事摘要",
  "durationMin": 90,
  "chapters": [{"title":"章节名","goal":"这一章承担的叙事功能"}],
  "segments": [
    {
      "title": "段落标题",
      "durationSec": 180,
      "narration": "完整解说词。要能直接配音,不要写镜头说明。",
      "imagePrompt": "用于生成该段主画面的中文提示词。画面要具体,不包含字幕。"
    }
  ]
}

要求:
- segments 总时长接近目标时长。
- 每段 narration 应该是完整自然的解说词,适合后续 TTS。
- 图片提示词要服务长视频,稳定、可连续,避免花哨短视频风格。
- 不要输出 Markdown。
`;

  const task = await createInstantTask({
    app: "longvideo",
    title: `生成长视频方案: ${project.title}`,
    meta: { projectId: project.id },
    payload: {
      messages: [
        { role: "system", content: "你只输出严格 JSON。" },
        { role: "user", content: prompt },
      ],
    },
  });

  if (!task?.success) {
    throw new Error(task?.message || "生成方案失败");
  }

  const outline = extractJson(task.response);
  const segments = normalizeSegments(outline.segments, project.durationMin);
  return updateProjectPlan({ id: project.id, outline, segments });
};

export {
  generatePlan,
};
