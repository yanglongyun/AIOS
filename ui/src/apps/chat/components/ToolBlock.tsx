import { Check, ChevronRight } from "lucide-react";
import type { DisplayMessage } from "../types";

export function ToolBlock({
  message,
  toggleTool,
}: {
  message: DisplayMessage;
  toggleTool: (id: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-[22px] flex-shrink-0 flex-col items-center pt-1">
        <div className="relative z-0 flex h-[22px] w-[22px] items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {message.result != null ? (
            <Check size={11} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
          ) : (
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500 dark:bg-amber-300" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
          <button
            type="button"
            className={[
              "flex w-full items-center gap-2 bg-transparent px-3.5 py-2 text-left text-xs text-slate-500 transition hover:text-slate-950 dark:text-neutral-400 dark:hover:text-neutral-100",
              message.expanded ? "border-b border-slate-200 dark:border-neutral-800" : "",
            ].join(" ")}
            onClick={() => toggleTool(message.id)}
          >
            <ChevronRight className={["shrink-0 text-slate-400 transition-transform dark:text-neutral-500", message.expanded ? "rotate-90" : ""].join(" ")} size={11} strokeWidth={2.5} />
            <span className="flex flex-1 min-w-0 items-center gap-1.5">
              <span className="shrink-0 font-mono text-xs">{message.toolName}</span>
              {message.toolSummary ? (
                <span className="min-w-0 truncate text-xs text-slate-500 dark:text-neutral-400">· {message.toolSummary}</span>
              ) : message.toolSub ? (
                <span className="min-w-0 truncate text-xs text-slate-400 dark:text-neutral-500">· {message.toolSub}</span>
              ) : null}
            </span>
            {message.result != null ? <span className="shrink-0 text-[10px] text-slate-400 dark:text-neutral-500">完成</span> : null}
            {message.result == null && !message.orphan ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400">
                <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-current/30 border-t-current" />
                执行中
              </span>
            ) : null}
          </button>

          {message.expanded ? (
            <>
              {message.shell && message.command ? (
                <div className="border-b border-slate-200 bg-slate-100 px-3.5 py-2 font-mono text-xs leading-relaxed text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                  <span className="text-emerald-600 dark:text-emerald-400">$ </span>
                  {message.command}
                </div>
              ) : message.args ? (
                <pre className="m-0 overflow-x-auto border-b border-slate-200 bg-slate-100 px-3.5 py-2 font-mono text-xs leading-relaxed text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">{message.args}</pre>
              ) : !message.orphan ? (
                <div className="border-b border-slate-200 bg-slate-100 px-3.5 py-2 font-mono text-xs leading-relaxed dark:border-neutral-800 dark:bg-neutral-950">
                  <span className="italic text-slate-400 dark:text-neutral-500">(无参数)</span>
                </div>
              ) : null}
              {message.result ? <pre className="m-0 max-h-[360px] overflow-auto bg-white px-3.5 py-2 font-mono text-xs leading-relaxed text-slate-700 dark:bg-neutral-900 dark:text-neutral-300">{message.result}</pre> : null}
              {message.result === "" ? <div className="bg-white px-3.5 py-2 font-mono text-xs italic text-slate-400 dark:bg-neutral-900 dark:text-neutral-500">(空输出)</div> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
