import { useState } from "react";
import { marked } from "marked";
import { Info } from "lucide-react";
import type { DisplayMessage } from "../types";
import { Logo } from "../../../system/components/Icon";
import { ToolBlock } from "./ToolBlock";

marked.setOptions({ breaks: true, gfm: true });

const renderMarkdown = (text: unknown) => marked.parse(String(text || ""), { async: false }) as string;

const messageBubbleClass =
  "max-w-[36rem] whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[0.94rem] leading-relaxed text-slate-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100";
const markdownBubbleClass = [
  "max-w-none break-words rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-[0.94rem] leading-relaxed text-slate-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100",
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-1",
  "[&_a]:text-amber-600 [&_a]:underline dark:[&_a]:text-amber-400",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 dark:[&_blockquote]:border-neutral-700 dark:[&_blockquote]:text-neutral-400",
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] dark:[&_code]:bg-neutral-800",
  "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-slate-200 [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:text-xs dark:[&_pre]:border-neutral-800 dark:[&_pre]:bg-neutral-950 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_hr]:my-4 [&_hr]:border-slate-200 dark:[&_hr]:border-neutral-800",
  "[&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_th]:border [&_td]:border [&_th]:border-slate-200 [&_td]:border-slate-200 [&_th]:px-2 [&_td]:px-2 [&_th]:py-1 [&_td]:py-1 dark:[&_th]:border-neutral-800 dark:[&_td]:border-neutral-800",
].join(" ");

export function MessageItem({
  message,
  toggleTool,
}: {
  message: DisplayMessage;
  toggleTool: (id: string) => void;
}) {
  const [usageOpen, setUsageOpen] = useState(false);

  if (message.role === "tool") return <ToolBlock message={message} toggleTool={toggleTool} />;

  if (message.source === "subscription") {
    return (
      <article className="flex gap-3 group">
        <Logo size="sm" />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400">订阅结果</div>
          <div className={markdownBubbleClass} dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
        </div>
      </article>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className={messageBubbleClass}>{message.content}</div>
      </div>
    );
  }

  const thinking = message.streaming && !String(message.content || "").trim();
  const hasUsage = !!message.usage && typeof message.usage === "object";

  return (
    <article className="flex gap-3 group">
      <Logo size="sm" />
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {thinking ? (
          <div className={markdownBubbleClass}>
            <span className="inline-flex items-center text-slate-500 dark:text-neutral-400">
              思考中
              <span className="ml-2 inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
              </span>
            </span>
          </div>
        ) : (
          <div className={markdownBubbleClass} dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />
        )}
        {hasUsage ? (
          <div className="flex flex-col items-start gap-1">
            <button
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              title="消息信息"
              onClick={() => setUsageOpen((value) => !value)}
            >
              <Info size={13} />
            </button>
            {usageOpen ? (
              <pre className="m-0 max-w-full overflow-x-auto rounded-md border border-slate-200 bg-slate-100 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
                {JSON.stringify(message.usage, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
        {message.memo ? (
          <div className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
            {message.memo}
          </div>
        ) : null}
      </div>
    </article>
  );
}
