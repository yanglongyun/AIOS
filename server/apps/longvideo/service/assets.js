import { createAudioJob, createImageJob } from "../providers/dashscope.js";
import { getProject, updateAssetStatuses, updateSegmentAudio, updateSegmentImage } from "../repository/projects.js";

const queueAssets = async ({ projectId }) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");
  if (!project.segments.length) throw new Error("请先生成大纲和解说");

  let imageConfigError = null;
  for (const segment of project.segments) {
    updateSegmentImage({ segmentId: segment.id, status: "running" });
    const imageResult = await createImageJob({ prompt: segment.imagePrompt });
    if (imageResult?.ok === false) {
      imageConfigError = imageResult;
      updateSegmentImage({
        segmentId: segment.id,
        status: "pending_provider_config",
        error: imageResult.message,
      });
      break;
    }
    updateSegmentImage({
      segmentId: segment.id,
      status: "ready",
      uri: imageResult.uri,
    });
  }

  let audioError = null;
  if (!imageConfigError) {
    for (const segment of getProject(project.id).segments) {
      updateSegmentAudio({ segmentId: segment.id, status: "running" });
      const audioResult = await createAudioJob({
        projectId: project.id,
        segmentId: segment.id,
        text: segment.narration,
      });
      if (audioResult?.ok === false) {
        audioError = audioResult;
        updateSegmentAudio({
          segmentId: segment.id,
          status: audioResult.code === "DASHSCOPE_API_KEY_NOT_CONFIGURED" ? "pending_provider_config" : "blocked",
          error: audioResult.message,
        });
        break;
      }
      updateSegmentAudio({
        segmentId: segment.id,
        status: "ready",
        uri: audioResult.uri,
      });
    }
  }

  const missingConfig = [imageConfigError, audioError].find((item) => item && item.ok === false);

  if (missingConfig) {
    return updateAssetStatuses({
      projectId: project.id,
      imageStatus: imageConfigError ? "pending_provider_config" : "ready",
      audioStatus: audioError?.code === "DASHSCOPE_API_KEY_NOT_CONFIGURED" ? "pending_provider_config" : "blocked",
      videoStatus: "blocked",
      error: missingConfig.message,
    });
  }

  return updateAssetStatuses({
    projectId: project.id,
    imageStatus: "ready",
    audioStatus: "ready",
    videoStatus: "draft",
    error: "",
  });
};

const assembleVideo = async ({ projectId }) => {
  const project = getProject(projectId);
  if (!project) throw new Error("项目不存在");
  if (!project.segments.length) throw new Error("请先生成分段");

  const missing = project.segments.some((segment) => !segment.imageUri || !segment.audioUri);
  if (missing) {
    return updateAssetStatuses({
      projectId: project.id,
      imageStatus: "pending_provider_config",
      audioStatus: "pending_provider_config",
      videoStatus: "blocked",
      error: "缺少图片或音频素材,无法拼接视频",
    });
  }

  return updateAssetStatuses({
    projectId: project.id,
    imageStatus: "ready",
    audioStatus: "ready",
    videoStatus: "queued",
    error: "",
  });
};

export {
  assembleVideo,
  queueAssets,
};
