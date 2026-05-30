import { mkdirSync, writeFileSync } from "fs";
import { dirname, extname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { getRawProviderSettings } from "../repository/settings.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../..");
const ENDPOINTS = {
  beijing: "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
  singapore: "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
};

const requireDashScopeConfig = () => {
  const settings = getRawProviderSettings();
  const apiKey = settings.dashscopeApiKey;
  if (!apiKey) {
    return {
      ok: false,
      code: "DASHSCOPE_API_KEY_NOT_CONFIGURED",
      message: "阿里云百炼 API Key 尚未配置",
    };
  }
  return {
    ok: true,
    apiKey,
    endpoint: ENDPOINTS[settings.dashscopeRegion] || ENDPOINTS.beijing,
    imageModel: settings.imageModel || "qwen-image-2.0-pro",
    imageSize: settings.imageSize || "2048*2048",
    imagePromptExtend: settings.imagePromptExtend !== "false",
    imageWatermark: settings.imageWatermark === "true",
    ttsModel: settings.ttsModel || "qwen3-tts-flash",
    ttsVoice: settings.ttsVoice || "Cherry",
    ttsLanguageType: settings.ttsLanguageType || "Chinese",
  };
};

const requestDashScope = async (config, body) => {
  const res = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok || data?.code) {
    return {
      ok: false,
      code: data?.code || "DASHSCOPE_REQUEST_FAILED",
      message: data?.message || `阿里云百炼接口返回 ${res.status}`,
      raw: data,
    };
  }
  return { ok: true, data };
};

const downloadToFile = async ({ projectId, kind, segmentId, url, ext }) => {
  const dir = join(root, "files", "exports", "longvideo", String(projectId), kind);
  mkdirSync(dir, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载百炼${kind === "image" ? "图片" : "音频"}失败: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!buffer.length) throw new Error("阿里云百炼返回空文件");
  let suffix = ext || extname(new URL(url).pathname) || (kind === "image" ? ".png" : ".wav");
  const filepath = join(dir, `segment-${segmentId}-${Date.now()}${suffix}`);
  writeFileSync(filepath, buffer);
  return filepath;
};

// 生成图片：调百炼拿到远端 URL，再落盘到 files/exports/longvideo/<pid>/image。
const createImageJob = async ({ prompt, projectId, segmentId }) => {
  const config = requireDashScopeConfig();
  if (!config.ok) return config;

  const result = await requestDashScope(config, {
    model: config.imageModel,
    input: {
      messages: [
        {
          role: "user",
          content: [{ text: String(prompt || "") }],
        },
      ],
    },
    parameters: {
      negative_prompt: "低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，蜡像感，人脸无细节，过度光滑，画面具有AI感，构图混乱，文字模糊，扭曲。",
      prompt_extend: config.imagePromptExtend,
      watermark: config.imageWatermark,
      size: config.imageSize,
      n: 1,
    },
  });
  if (!result.ok) return result;

  const image = result.data?.output?.choices?.[0]?.message?.content?.find((item) => item.image)?.image || "";
  if (!image) {
    return {
      ok: false,
      code: "DASHSCOPE_IMAGE_MISSING_URL",
      message: "阿里云百炼图片接口未返回图片 URL",
      raw: result.data,
    };
  }

  // 配置测试场景没有 projectId，只验证连通性，不落盘。
  if (!projectId) return { ok: true, uri: image, raw: result.data };

  try {
    const localPath = await downloadToFile({
      projectId, kind: "image", segmentId, url: image,
    });
    return { ok: true, uri: image, localPath, raw: result.data };
  } catch (err) {
    return { ok: false, code: "DASHSCOPE_IMAGE_DOWNLOAD_FAILED", message: err.message };
  }
};

const saveAudio = async ({ projectId, segmentId, url, data }) => {
  const dir = join(root, "files", "exports", "longvideo", String(projectId), "audio");
  mkdirSync(dir, { recursive: true });

  let buffer = Buffer.alloc(0);
  let suffix = ".wav";
  if (data) {
    buffer = Buffer.from(String(data), "base64");
  } else if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`下载百炼语音结果失败: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
    const parsed = new URL(url);
    const pathExt = extname(parsed.pathname);
    if (pathExt) suffix = pathExt;
  }
  if (!buffer.length) throw new Error("阿里云百炼语音接口未返回音频数据");

  const filepath = join(dir, `segment-${segmentId}-${Date.now()}${suffix}`);
  writeFileSync(filepath, buffer);
  return filepath;
};

const createAudioJob = async ({ projectId, segmentId, text }) => {
  const config = requireDashScopeConfig();
  if (!config.ok) return config;

  const result = await requestDashScope(config, {
    model: config.ttsModel,
    input: {
      text: String(text || ""),
      voice: config.ttsVoice,
      language_type: config.ttsLanguageType,
    },
  });
  if (!result.ok) return result;

  const audio = result.data?.output?.audio || {};
  try {
    const localPath = await saveAudio({
      projectId,
      segmentId,
      url: audio.url,
      data: audio.data,
    });
    return { ok: true, localPath, raw: result.data };
  } catch (err) {
    return { ok: false, code: "DASHSCOPE_AUDIO_DOWNLOAD_FAILED", message: err.message };
  }
};

export {
  createAudioJob,
  createImageJob,
};
