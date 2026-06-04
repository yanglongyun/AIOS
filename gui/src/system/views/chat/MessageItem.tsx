import type { DisplayMessage } from "../../api";
import { renderMarkdown } from "../../lib/markdown";
import { Logo } from "../../components/Icon";
import { ToolBlock } from "./ToolBlock";

export function MessageItem({
  message,
  toggleTool,
}: {
  message: DisplayMessage;
  toggleTool: (id: string) => void;
}) {
  if (message.role === "tool") return <ToolBlock message={message} toggleTool={toggleTool} />;

  if (message.monitor) {
    const { title, event, body } = message.monitor;
    return (
      <div className="flex justify-center">
        <div
          className="w-full max-w-[40rem] rounded-xl border px-3.5 py-2.5 text-sm"
          style={{ borderColor: "var(--color-accent)", background: "color-mix(in srgb, var(--color-accent) 8%, transparent)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xxs font-semibold uppercase tracking-wider" style={{ color: "var(--color-accent)" }}>
              ◎ 监视器
            </span>
            <span className="text-text font-medium truncate">{title}</span>
            <span className="ml-auto text-xxs px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "color-mix(in srgb, var(--color-accent) 18%, transparent)", color: "var(--color-accent)" }}>
              {event}
            </span>
          </div>
          {body ? <div className="text-text-mute whitespace-pre-wrap text-xs leading-relaxed">{body}</div> : null}
        </div>
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="msg-content max-w-[36rem]">{message.content}</div>
      </div>
    );
  }

  return (
    <article className="flex gap-3 group">
      <Logo size="sm" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="msg-content msg-md md-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
        {message.memo ? (
          <div className="inline-flex items-center gap-1 text-xxs" style={{ color: "var(--color-accent)" }}>
            {message.memo}
          </div>
        ) : null}
      </div>
    </article>
  );
}
