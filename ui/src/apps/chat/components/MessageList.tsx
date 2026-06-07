import { useEffect, useRef, useState } from "react";
import type { DisplayMessage } from "../types";
import { Logo } from "../../../system/components/Icon";
import { MessageItem } from "./MessageItem";
import { WelcomePanel } from "./WelcomePanel";

export function MessageList({
  messages,
  busy,
  toggleTool,
}: {
  messages: DisplayMessage[];
  busy: boolean;
  toggleTool: (id: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [stick, setStick] = useState(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    if (!stick || !boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [busy, messages, stick]);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.clientHeight - el.scrollTop < 120;
    setStick(near);
    setShowScrollDown(!near && messages.length > 0);
  };
  const hasStreamingAssistant = messages.some((message) => message.role === "assistant" && message.streaming);

  return (
    <>
      <div ref={boxRef} className="flex-1 min-h-0 overflow-y-auto" onScroll={onScroll}>
        <div className="mx-auto max-w-3xl xl:max-w-4xl px-5 pt-2 pb-44 flex flex-col gap-6 sm:gap-7">
          {messages.length === 0 ? <WelcomePanel /> : null}
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} toggleTool={toggleTool} />
          ))}
          {busy && !hasStreamingAssistant ? (
            <article className="flex gap-3">
              <Logo size="sm" />
              <div className="flex min-h-12 items-center text-sm text-slate-500 dark:text-neutral-400">
                <span>思考中</span>
                <span className="ml-2 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                </span>
              </div>
            </article>
          ) : null}
        </div>
      </div>

      {showScrollDown ? (
        <button
          className="absolute bottom-24 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-lg transition-all hover:bg-slate-100 hover:text-slate-950 md:bottom-28 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          title="滚动到最新"
          onClick={() => boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" })}
        >
          ↓
        </button>
      ) : null}
    </>
  );
}
