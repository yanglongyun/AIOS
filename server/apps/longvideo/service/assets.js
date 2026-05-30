import { createAudioJob, createImageJob } from "../providers/dashscope.js";
import {
  getProject, getSegment, listSegments, updateProject,
  updateSegmentAudio, updateSegmentImage,
} from "../repository/projects.js";
import { enqueue } from "./queue.js";
import { hasFfmpeg, probeDuration, renderProject } from "./ffmpeg.js";

const RETRY = 2;

const withRetry = async (fn) => {
  let last;
  for (let attempt = 1; attempt <= RETRY; attempt += 1) {
    const result = await fn();
    if (result?.ok !== false) return result;
    last = result;
    // 配置缺失没必要重试
    if (result.code === "DASHSCOPE_API_KEY_NOT_CONFIGURED") return result;
  }
  return last;
};

// ── 单段素材生成（图片 + 语音） ───────────────────────────────────────────────
const generateSegmentAssets = async (segment) => {
  // 图片
  if (segment.imageStatus !== "ready" || !segment.imageLocal) {
    updateSegmentImage({ segmentId: segment.id, status: "running", error: "" });
    const img = await withRetry(() => createImageJob({
      prompt: segment.imagePrompt, projectId: segment.projectId, segmentId: segment.id,
    }));
    if (img?.ok === false) {
      updateSegmentImage({ segmentId: segment.id, status: "error", error: img.message });
      return false;
    }
    updateSegmentImage({ segmentId: segment.id, status: "ready", uri: img.uri, local: img.localPath, error: "" });
  }

  // 语音 + 真实时长
  const fresh = getSegment(segment.id);
  if (fresh.audioStatus !== "ready" || !fresh.audioLocal) {
    updateSegmentAudio({ segmentId: segment.id, status: "running", error: "" });
    const audio = await withRetry(() => createAudioJob({
      projectId: segment.projectId, segmentId: segment.id, text: segment.narration,
    }));
    if (audio?.ok === false) {
      updateSegmentAudio({ segmentId: segment.id, status: "error", error: audio.message });
      return false;
    }
    let duration = 0;
    try { duration = await probeDuration(audio.localPath); } catch { /* 渲染时再兜底 */ }
    updateSegmentAudio({ segmentId: segment.id, status: "ready", local: audio.localPath, duration, error: "" });
  }
  return true;
};

const recomputeProgress = (projectId) => {
  const segs = listSegments(projectId);
  const total = segs.length * 2; // 图片 + 语音
  const ready = segs.reduce((n, s) =>
    n + (s.imageStatus === "ready" ? 1 : 0) + (s.audioStatus === "ready" ? 1 : 0), 0);
  return total ? Math.round((ready / total) * 100) : 0;
};

// ── 批量生成（入队，立即返回 generating 态项目） ─────────────────────────────
const runAllAssets = async (projectId) => {
  const segs = listSegments(projectId);
  let failed = false;
  for (const segment of segs) {
    const ok = await generateSegmentAssets(segment);
    if (!ok) failed = true;
    updateProject({ id: projectId, progress: recomputeProgress(projectId) });
  }
  const all = listSegments(projectId);
  const ready = all.every((s) => s.imageStatus === "ready" && s.audioStatus === "ready");
  updateProject({
    id: projectId,
    status: ready ? "assets_ready" : "error",
    progress: recomputeProgress(projectId),
    error: failed ? "部分素材生成失败，可对失败段落单独重试" : "",
  });
};

const queueAssets = ({ projectId }) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");
  if (!project.segments.length) throw new Error("请先生成大纲和解说");
  updateProject({ id: projectId, status: "generating", error: "" });
  enqueue({
    key: `assets:${projectId}`,
    label: `生成素材 #${projectId}`,
    run: () => runAllAssets(projectId),
  });
  return getProject(projectId);
};

// ── 单段重试 ───────────────────────────────────────────────────────────────────
const retrySegment = ({ segmentId }) => {
  const segment = getSegment(segmentId);
  if (!segment) throw new Error("段落不存在");
  const projectId = segment.projectId;
  updateProject({ id: projectId, status: "generating", error: "" });
  if (segment.imageStatus !== "ready") updateSegmentImage({ segmentId, status: "running", error: "" });
  if (segment.audioStatus !== "ready") updateSegmentAudio({ segmentId, status: "running", error: "" });
  enqueue({
    key: `seg:${segmentId}`,
    label: `重试段落 #${segmentId}`,
    run: async () => {
      // 重试只重做未就绪的部分
      const seg = getSegment(segmentId);
      await generateSegmentAssets({ ...seg, imageStatus: "idle", audioStatus: seg.audioStatus });
      const all = listSegments(projectId);
      const ready = all.every((s) => s.imageStatus === "ready" && s.audioStatus === "ready");
      updateProject({
        id: projectId,
        status: ready ? "assets_ready" : "error",
        progress: recomputeProgress(projectId),
        error: ready ? "" : "仍有段落未完成",
      });
    },
  });
  return getProject(projectId);
};

// ── 拼接出片（真实 ffmpeg，入队） ─────────────────────────────────────────────
const assembleVideo = async ({ projectId }) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");
  if (!project.segments.length) throw new Error("请先生成分段");

  const missing = project.segments.find((s) => s.imageStatus !== "ready" || s.audioStatus !== "ready");
  if (missing) throw new Error(`第 ${missing.index} 段素材未就绪，无法拼接`);

  if (!(await hasFfmpeg())) {
    return updateProject({ id: projectId, status: "error", error: "未检测到 ffmpeg/ffprobe，请先安装" });
  }

  updateProject({ id: projectId, status: "rendering", progress: 0, error: "", videoPath: "" });
  enqueue({
    key: `render:${projectId}`,
    label: `拼接视频 #${projectId}`,
    run: async () => {
      try {
        const segments = listSegments(projectId);
        const finalPath = await renderProject({
          projectId,
          segments,
          onProgress: (done, total) =>
            updateProject({ id: projectId, progress: total ? Math.round((done / total) * 100) : 0 }),
        });
        updateProject({ id: projectId, status: "done", progress: 100, videoPath: finalPath, error: "" });
      } catch (err) {
        updateProject({ id: projectId, status: "error", error: err.message });
      }
    },
  });
  return getProject(projectId);
};

export {
  assembleVideo,
  queueAssets,
  retrySegment,
};
