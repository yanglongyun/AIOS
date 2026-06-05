import { Check, ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { DisplayMessage } from "../../api";

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
        <div
          className="relative z-0 flex h-[22px] w-[22px] items-center justify-center rounded-md ring-1 bg-bg-raised"
          style={{ boxShadow: message.result == null ? "0 0 0 1px var(--color-accent-soft)" : "", "--tw-ring-color": "var(--color-border)" } as CSSProperties}
        >
          {message.result != null ? (
            <Check size={11} className="text-success" strokeWidth={2.5} />
          ) : (
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--color-accent)", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={["tool-card", message.expanded ? "expanded" : ""].join(" ")}>
          <button type="button" className="tool-card-head" onClick={() => toggleTool(message._id)}>
            <ChevronRight className="tool-chevron shrink-0" size={11} strokeWidth={2.5} />
            <span className="flex-1 min-w-0 font-mono text-xs truncate">
              {message.toolName}
              {message.toolSub ? <span className="text-text-faint ml-1">· {message.toolSub}</span> : null}
            </span>
            {message.result != null ? <span className="shrink-0 text-xxs text-text-faint">完成</span> : null}
            {message.result == null && !message.orphan ? (
              <span className="shrink-0 text-xxs inline-flex items-center gap-1.5" style={{ color: "var(--color-accent)" }}>
                <span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-current/30 animate-[tool-spin_0.8s_linear_infinite]" style={{ borderTopColor: "currentColor" }} />
                执行中
              </span>
            ) : null}
          </button>

          {message.expanded ? (
            <>
              {message.shell && message.command ? (
                <div className="tool-cmd">
                  <span className="tool-cmd-prompt">$ </span>
                  {message.command}
                </div>
              ) : message.args ? (
                <pre className="tool-args">{message.args}</pre>
              ) : !message.orphan ? (
                <div className="tool-args">
                  <span className="text-text-faint italic">(无参数)</span>
                </div>
              ) : null}
              {message.result ? <pre className="tool-result">{message.result}</pre> : null}
              {message.result === "" ? <div className="tool-result text-text-faint italic">(空输出)</div> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
