import { useEffect, useState } from "react";
import type { Settings } from "../api";
import { api } from "../api";
import { ModelSettings } from "./settings/ModelSettings";
import { SystemPromptSettings } from "./settings/SystemPromptSettings";

const DEFAULT_SETTINGS: Settings = {
  apiUrl: "",
  apiKey: "",
  model: "",
  system: "",
  contextTurns: 100,
};

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [defaultSystem, setDefaultSystem] = useState("");
  const [statusText, setStatusText] = useState("");

  const refresh = async () => {
    setStatusText("");
    try {
      const result = await api.getSettings();
      setDefaultSystem(result.defaultSystem || "");
      setSettings({ ...DEFAULT_SETTINGS, ...(result.settings || {}) });
    } catch (error) {
      setStatusText(`加载失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const save = async () => {
    setStatusText("保存中…");
    try {
      await api.saveSettings(settings);
      await refresh();
      setStatusText("已保存");
      window.setTimeout(() => setStatusText(""), 1500);
    } catch (error) {
      setStatusText(`保存失败：${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const applyDefaultSystem = () => {
    if (settings.system && !window.confirm("当前系统提示词非空，是否用默认模板覆盖？")) return;
    setSettings((current) => ({ ...current, system: defaultSystem }));
  };

  const clearSystem = () => {
    if (!settings.system) return;
    if (!window.confirm("清空系统提示词？")) return;
    setSettings((current) => ({ ...current, system: "" }));
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-5 py-6 flex flex-col gap-6">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="m-0 text-2xl font-semibold text-text leading-tight">设置</h2>
            <p className="m-0 text-sm text-text-mute">模型连接、上下文与系统提示</p>
          </div>
          <div className="flex items-center gap-2">
            {statusText ? <span className="text-xs text-text-mute">{statusText}</span> : null}
            <button className="btn btn-sm btn-ghost" onClick={refresh}>重载</button>
            <button className="btn btn-sm btn-primary" onClick={save}>保存</button>
          </div>
        </header>
        <ModelSettings
          settings={settings}
          setSettings={setSettings}
        />
        <SystemPromptSettings
          system={settings.system}
          setSystem={(system) => setSettings((current) => ({ ...current, system }))}
          applyDefault={applyDefaultSystem}
          clearSystem={clearSystem}
        />
      </div>
    </div>
  );
}
