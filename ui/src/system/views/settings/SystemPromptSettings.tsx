export function SystemPromptSettings({
  system,
  setSystem,
  applyDefault,
  clearSystem,
}: {
  system: string;
  setSystem: (system: string) => void;
  applyDefault: () => void;
  clearSystem: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border-soft bg-bg-raised p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="m-0 text-sm font-semibold text-text">系统提示词</h3>
          <p className="m-0 text-xs text-text-mute">注入到每次请求前的 system 消息</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm btn-ghost" onClick={clearSystem}>清空</button>
          <button className="btn btn-sm" onClick={applyDefault}>使用默认模板</button>
        </div>
      </div>
      <div className="field">
        <textarea
          value={system}
          className="textarea font-mono text-xs leading-relaxed"
          rows={16}
          placeholder="定义 Agent 的角色、风格、工具使用规范…  点右上「使用默认模板」可填入推荐内容。"
          onChange={(event) => setSystem(event.target.value)}
        />
        <span className="field-hint">
          推荐包含三件事：
          <code className="font-mono text-[11.5px] bg-bg-inset border border-border-soft rounded px-1 text-text-dim">&lt;memo&gt;</code> /
          <code className="font-mono text-[11.5px] bg-bg-inset border border-border-soft rounded px-1 text-text-dim">&lt;summary&gt;</code>
          协议说明、终端工具使用规范、回复风格。
        </span>
      </div>
    </section>
  );
}
