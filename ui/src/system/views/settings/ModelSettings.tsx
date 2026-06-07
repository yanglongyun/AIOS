import type { ReactNode } from "react";
import type { ModelProvider, ProviderGroup, Settings } from "./index";

const cardClass = "rounded-lg border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900";
const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-300";
const hintClass = "text-[10px] leading-snug text-slate-500 dark:text-neutral-400";

export function ModelSettings({
  settings,
  setSettings,
  providerGroups,
  providers,
}: {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  providerGroups: ProviderGroup[];
  providers: ModelProvider[];
}) {
  const selectedProvider = providers.find((item) => item.id === settings.provider);
  const models = selectedProvider?.models || [];

  const setProvider = (providerId: string) => {
    const provider = providers.find((item) => item.id === providerId);
    setSettings({
      ...settings,
      provider: providerId,
      apiUrl: provider?.apiUrl || "",
      model: provider?.defaultModel || "",
    });
  };

  return (
    <section className={`${cardClass} flex flex-col gap-4`}>
      <h3 className="m-0 text-sm font-semibold text-slate-950 dark:text-neutral-100">模型接入</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Provider" hint="由 LLM 清单维护，影响请求头与流式解析">
          <select value={settings.provider || ""} className={inputClass} onChange={(event) => setProvider(event.target.value)}>
            <option value="">选择 Provider</option>
            {providerGroups.map((group) => (
              <optgroup key={group.id} label={group.name}>
                {providers
                  .filter((provider) => provider.group === group.id)
                  .map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.name}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="API URL" hint="OpenAI 格式的接口地址">
          <input value={settings.apiUrl} className={inputClass} placeholder="https://api.openai.com/v1/chat/completions" onChange={(event) => setSettings({ ...settings, apiUrl: event.target.value })} />
        </Field>
        <Field label="API Key" hint="存储在本地数据库，不会外发">
          <input value={settings.apiKey} className={inputClass} type="password" placeholder="sk-..." onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })} />
        </Field>
        <Field label="模型" hint={models.length ? "由当前 Provider 的 LLM 清单维护" : "自定义 Provider 需要手动填写"}>
          {models.length ? (
            <select value={settings.model || ""} className={inputClass} onChange={(event) => setSettings({ ...settings, model: event.target.value })}>
              <option value="">选择模型</option>
              {models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          ) : (
            <input value={settings.model} className={inputClass} placeholder="model id" onChange={(event) => setSettings({ ...settings, model: event.target.value })} />
          )}
        </Field>
        <Field label="上下文轮数" hint="发送前保留的最近对话轮数">
          <input value={settings.contextTurns} className={inputClass} type="number" min={0} onChange={(event) => setSettings({ ...settings, contextTurns: Number(event.target.value) || 0 })} />
        </Field>
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>{label}</label>
      {children}
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </div>
  );
}
