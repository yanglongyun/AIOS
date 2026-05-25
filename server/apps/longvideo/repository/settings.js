import { db } from "./client.js";

const keys = [
  "arkApiKey",
  "ttsApiKey",
  "ttsResourceId",
  "ttsSpeaker",
  "ttsFormat",
  "ttsSampleRate",
];

const secretKeys = new Set(["arkApiKey", "ttsApiKey"]);

const defaults = {
  arkApiKey: "",
  ttsApiKey: "",
  ttsResourceId: "seed-tts-2.0",
  ttsSpeaker: "zh_female_shuangkuaisisi_moon_bigtts",
  ttsFormat: "mp3",
  ttsSampleRate: "24000",
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
