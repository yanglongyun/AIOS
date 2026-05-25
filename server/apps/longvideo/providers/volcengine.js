import { mkdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { getRawProviderSettings } from "../repository/settings.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../..");
const ARK_IMAGE_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const ARK_IMAGE_MODEL = "doubao-seedream-5-0-260128";
const TTS_ENDPOINT = "https://openspeech.bytedance.com/api/v3/tts/unidirectional";

const requireArkConfig = () => {
  const settings = getRawProviderSettings();
  const apiKey = settings.arkApiKey;
  if (!apiKey) {
    return {
      ok: false,
      code: "ARK_API_KEY_NOT_CONFIGURED",
      message: "火山引擎 Ark 图片接口尚未配置",
    };
  }
  return { ok: true, apiKey };
};

const requireVolcengineAudioConfig = () => {
  const settings = getRawProviderSettings();
  const apiKey = settings.ttsApiKey;
  const resourceId = settings.ttsResourceId;
  const speaker = settings.ttsSpeaker;
  if (!apiKey || !resourceId || !speaker) {
    return {
      ok: false,
      code: "VOLCENGINE_AUDIO_NOT_CONFIGURED",
      message: "火山引擎音频接口尚未配置",
    };
  }
  return {
    ok: true,
    apiKey,
    resourceId,
    speaker,
    format: settings.ttsFormat || "mp3",
    sampleRate: Number(settings.ttsSampleRate || 24000),
  };
};

const saveAudio = ({ projectId, segmentId, audio }) => {
  const dir = join(root, "files", "exports", "longvideo", String(projectId), "audio");
  mkdirSync(dir, { recursive: true });
  const filename = `segment-${segmentId}-${Date.now()}.mp3`;
  const filepath = join(dir, filename);
  writeFileSync(filepath, audio);
  return filepath;
};

const readSized = (buffer, offset) => {
  if (offset + 4 > buffer.length) return { value: Buffer.alloc(0), offset: buffer.length };
  const size = buffer.readUInt32BE(offset);
  const start = offset + 4;
  const end = Math.min(start + size, buffer.length);
  return { value: buffer.subarray(start, end), offset: end };
};

const parseTtsFrame = (data) => {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const headerSize = (buffer[0] & 0x0f) * 4;
  const messageType = buffer[1] >> 4;
  const flags = buffer[1] & 0x0f;
  const serialization = buffer[2] >> 4;
  let offset = headerSize;
  let event = null;

  if (flags === 0x04 && offset + 4 <= buffer.length) {
    event = buffer.readInt32BE(offset);
    offset += 4;
  }

  if (messageType === 0x0f) {
    const code = offset + 4 <= buffer.length ? buffer.readInt32BE(offset) : 0;
    const payload = offset + 8 <= buffer.length ? readSized(buffer, offset + 4).value : buffer.subarray(offset + 4);
    return { messageType, event, code, json: parseFrameJson(payload), payload };
  }

  const fields = [];
  while (offset + 4 <= buffer.length) {
    const part = readSized(buffer, offset);
    fields.push(part.value);
    offset = part.offset;
  }

  const payload = fields.at(-1) || Buffer.alloc(0);
  return {
    messageType,
    event,
    fields,
    payload,
    json: serialization === 1 ? parseFrameJson(payload) : null,
  };
};

const parseFrameJson = (payload) => {
  const text = Buffer.from(payload || "").toString("utf8").trim();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
};

const readTtsResponse = async (res) => {
  const chunks = [];
  const errors = [];
  for await (const chunk of res.body) {
    const frame = parseTtsFrame(Buffer.from(chunk));
    if (frame.messageType === 0x0f) errors.push(frame.json?.message || `火山引擎 TTS 返回错误 ${frame.code || ""}`.trim());
    else if (frame.payload?.length) chunks.push(frame.payload);
  }
  if (errors.length) throw new Error(errors.join("; "));
  return Buffer.concat(chunks);
};

const createAudioJob = async ({ projectId, segmentId, text }) => {
  const config = requireVolcengineAudioConfig();
  if (!config.ok) return config;

  const res = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": config.apiKey,
      "X-Api-Resource-Id": config.resourceId,
      "X-Api-Connect-Id": randomUUID(),
    },
    body: JSON.stringify({
      user: { uid: "aios-longvideo" },
      event: 100,
      namespace: "BidirectionalTTS",
      req_params: {
        text: String(text || ""),
        speaker: config.speaker,
        audio_params: {
          format: config.format,
          sample_rate: config.sampleRate,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      ok: false,
      code: "VOLCENGINE_TTS_FAILED",
      message: body || `火山引擎语音接口返回 ${res.status}`,
    };
  }

  const audio = await readTtsResponse(res);
  if (!audio.length) {
    return {
      ok: false,
      code: "VOLCENGINE_TTS_MISSING_AUDIO",
      message: "火山引擎语音接口未返回音频数据",
    };
  }

  return {
    ok: true,
    uri: saveAudio({ projectId, segmentId, audio }),
  };
};

const createImageJob = async ({ prompt }) => {
  const config = requireArkConfig();
  if (!config.ok) return config;

  const res = await fetch(ARK_IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: ARK_IMAGE_MODEL,
      prompt,
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "2K",
      stream: false,
      watermark: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ark image ${res.status}: ${text}`);
  }

  const json = await res.json();
  const url = json?.data?.[0]?.url || json?.data?.[0]?.b64_json || "";
  if (!url) {
    throw new Error("Ark image response missing data[0].url");
  }

  return {
    ok: true,
    uri: url,
    raw: json,
  };
};

export {
  createAudioJob,
  createImageJob,
};
