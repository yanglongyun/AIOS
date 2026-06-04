import type { ReactNode } from "react";
import type { Settings } from "../../api";

export function ModelSettings({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-bg-raised p-5 flex flex-col gap-4">
      <h3 className="m-0 text-sm font-semibold text-text">模型接入</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="API URL" hint="兼容 OpenAI 格式的接口地址">
          <input value={settings.apiUrl} className="input" placeholder="https://api.openai.com/v1/chat/completions" onChange={(event) => setSettings({ ...settings, apiUrl: event.target.value })} />
        </Field>
        <Field label="API Key" hint="存储在本地数据库，不会外发">
          <input value={settings.apiKey} className="input" type="password" placeholder="sk-..." onChange={(event) => setSettings({ ...settings, apiKey: event.target.value })} />
        </Field>
        <Field label="模型">
          <input value={settings.model} className="input" placeholder="gpt-5.5 / deepseek-chat / qwen-plus" onChange={(event) => setSettings({ ...settings, model: event.target.value })} />
        </Field>
        <Field label="Provider" hint="影响请求头与流式解析;留空按 URL 自动判断">
          <select value={settings.provider || ""} className="input" onChange={(event) => setSettings({ ...settings, provider: event.target.value })}>
            <option value="">自动(OpenAI 兼容)</option>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="kimi">Kimi</option>
            <option value="gemini">Gemini</option>
            <option value="claude">Claude</option>
          </select>
        </Field>
        <Field label="上下文轮数" hint="发送前保留的最近对话轮数">
          <input value={settings.contextTurns} className="input" type="number" min={0} onChange={(event) => setSettings({ ...settings, contextTurns: Number(event.target.value) || 0 })} />
        </Field>
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
