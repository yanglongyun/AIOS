const cardClass = "rounded-lg border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900";
const ghostButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
const buttonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800";
const textareaClass =
  "min-h-[24rem] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500";

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
    <section className={`${cardClass} flex flex-col gap-4`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="m-0 text-sm font-semibold text-slate-950 dark:text-neutral-100">系统提示词</h3>
          <p className="m-0 text-xs text-slate-500 dark:text-neutral-400">注入到每次请求前的 system 消息</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={ghostButtonClass} onClick={clearSystem}>清空</button>
          <button className={buttonClass} onClick={applyDefault}>使用默认模板</button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <textarea
          value={system}
          className={textareaClass}
          rows={16}
          placeholder="定义 Agent 的角色、风格、工具使用规范…  点右上「使用默认模板」可填入推荐内容。"
          onChange={(event) => setSystem(event.target.value)}
        />
        <span className="text-[10px] leading-snug text-slate-500 dark:text-neutral-400">
          推荐包含三件事：
          <code className="rounded border border-slate-200 bg-slate-100 px-1 font-mono text-[11.5px] text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">&lt;memo&gt;</code> /
          <code className="rounded border border-slate-200 bg-slate-100 px-1 font-mono text-[11.5px] text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">&lt;summary&gt;</code>
          协议说明、终端工具使用规范、回复风格。
        </span>
      </div>
    </section>
  );
}
