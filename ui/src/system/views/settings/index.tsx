import { useEffect, useState } from "react";
import { ModelSettings } from "./ModelSettings";
import { SystemPromptSettings } from "./SystemPromptSettings";
import { ThemeSettings } from "./ThemeSettings";

export type Settings = {
  apiUrl: string;
  apiKey: string;
  model: string;
  provider?: string;
  system: string;
  contextTurns: number;
};

export type ProviderGroup = {
  id: string;
  name: string;
};

export type ModelProvider = {
  id: string;
  name: string;
  group: string;
  apiUrl: string;
  defaultModel: string;
  models: string[];
};

const DEFAULT_SETTINGS: Settings = {
  apiUrl: "",
  apiKey: "",
  model: "",
  system: "",
  contextTurns: 100,
};

const getSettings = async () => {
  const response = await fetch("/api/settings");
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as { settings: Settings; defaultSystem?: string };
};

const getModelProviders = async () => {
  const response = await fetch("/api/settings/models");
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as { groups: ProviderGroup[]; providers: ModelProvider[] };
};

const saveSettings = async (settings: Settings) => {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
};

const ghostButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
const primaryButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200";

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [providerGroups, setProviderGroups] = useState<ProviderGroup[]>([]);
  const [modelProviders, setModelProviders] = useState<ModelProvider[]>([]);
  const [defaultSystem, setDefaultSystem] = useState("");
  const [statusText, setStatusText] = useState("");

  const refresh = async () => {
    setStatusText("");
    try {
      const [result, modelResult] = await Promise.all([getSettings(), getModelProviders()]);
      setProviderGroups(modelResult.groups || []);
      setModelProviders(modelResult.providers || []);
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
      await saveSettings(settings);
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
            <h2 className="m-0 text-2xl font-semibold leading-tight text-slate-950 dark:text-neutral-100">设置</h2>
            <p className="m-0 text-sm text-slate-500 dark:text-neutral-400">模型连接、上下文与系统提示</p>
          </div>
          <div className="flex items-center gap-2">
            {statusText ? <span className="text-xs text-slate-500 dark:text-neutral-400">{statusText}</span> : null}
            <button className={ghostButtonClass} onClick={refresh}>重载</button>
            <button className={primaryButtonClass} onClick={save}>保存</button>
          </div>
        </header>
        <ModelSettings
          settings={settings}
          setSettings={setSettings}
          providerGroups={providerGroups}
          providers={modelProviders}
        />
        <ThemeSettings />
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
