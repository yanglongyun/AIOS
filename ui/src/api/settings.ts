import { request, jsonBody } from "../lib/http";

export type Settings = {
  apiUrl: string;
  apiKey: string;
  model: string;
  system: string;
  compressThreshold?: string;
  compactPrompt?: string;
  toolResultMaxChars?: string;
  /** 工具循环:limit on/off;on 时每轮最多 maxToolRounds 轮。 */
  toolRoundsLimit?: string;
  maxToolRounds?: string;
};

export const settingsApi = {
  getSettings: () => request<{ settings: Settings }>("/api/settings"),
  saveSettings: (s: Partial<Settings>) =>
    request<{ settings: Settings }>("/api/settings", { method: "POST", ...jsonBody(s) }).then((result) => {
      window.dispatchEvent(new Event("aios:settings-saved"));
      return result;
    }),
};
