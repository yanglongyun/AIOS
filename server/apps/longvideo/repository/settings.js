import { db } from "./client.js";

const keys = [
  "arkApiKey",
  "ttsApiKey",
  "ttsResourceId",
  "ttsSpeaker",
  "ttsFormat",
  "ttsSampleRate",
  "projectPromptTemplate",
  "planPromptTemplate",
];

const secretKeys = new Set(["arkApiKey", "ttsApiKey"]);

const defaults = {
  arkApiKey: "",
  ttsApiKey: "",
  ttsResourceId: "seed-tts-2.0",
  ttsSpeaker: "zh_female_shuangkuaisisi_moon_bigtts",
  ttsFormat: "mp3",
  ttsSampleRate: "24000",
  projectPromptTemplate: "根据标题生成一段适合视频工坊使用的项目描述。要求包含主题范围、叙事角度、内容结构、画面气质和解说风格，语言具体但不要过长。\n\n标题：{title}",
  planPromptTemplate: `你是视频总编导。请根据标题和项目描述生成可执行的视频制作方案。

标题: {title}
项目描述: {prompt}

请只返回 JSON,不要解释。结构:
{
  "title": "视频标题",
  "summary": "整体叙事摘要",
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
- 图片提示词要服务视频叙事,稳定、可连续,避免花哨短视频风格。
- 不要输出 Markdown。`,
};

const getRawProviderSettings = () => {
  const rows = db.prepare(`
    SELECT key, value
    FROM longvideo_provider_settings
  `).all();

  return rows.reduce((settings, row) => {
    if (keys.includes(row.key)) settings[row.key] = row.value;
    return settings;
  }, { ...defaults });
};

const getPublicProviderSettings = () => {
  const settings = getRawProviderSettings();
  return {
    arkApiKey: "",
    ttsApiKey: "",
    ttsResourceId: settings.ttsResourceId,
    ttsSpeaker: settings.ttsSpeaker,
    ttsFormat: settings.ttsFormat,
    ttsSampleRate: settings.ttsSampleRate,
    projectPromptTemplate: settings.projectPromptTemplate,
    planPromptTemplate: settings.planPromptTemplate,
    configured: {
      arkApiKey: Boolean(settings.arkApiKey),
      ttsApiKey: Boolean(settings.ttsApiKey),
      image: Boolean(settings.arkApiKey),
      audio: Boolean(settings.ttsApiKey && settings.ttsResourceId && settings.ttsSpeaker),
    },
  };
};

const saveProviderSettings = (input = {}) => {
  const existing = getRawProviderSettings();
  const next = {};

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
    const value = String(input[key] || "").trim();
    if (secretKeys.has(key) && !value) continue;
    next[key] = value;
  }

  if (input.clearSecrets === true) {
    next.arkApiKey = "";
    next.ttsApiKey = "";
  }

  const upsert = db.prepare(`
    INSERT INTO longvideo_provider_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  db.exec("BEGIN");
  try {
    for (const [key, value] of Object.entries({ ...existing, ...next })) {
      if (keys.includes(key)) upsert.run(key, String(value || ""));
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return getPublicProviderSettings();
};

export {
  getPublicProviderSettings,
  getRawProviderSettings,
  saveProviderSettings,
};
