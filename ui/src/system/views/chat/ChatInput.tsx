import { useEffect, useRef, useState } from "react";

export function ChatInput({
  value,
  setValue,
  sending,
  errorText,
  send,
  stop,
}: {
  value: string;
  setValue: (value: string) => void;
  sending: boolean;
  errorText: string;
  send: () => void;
  stop: () => void;
}) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  return (
    <div className="shrink-0 px-4 md:px-5 pb-4 md:pb-5 pt-2">
      <div className="mx-auto max-w-3xl xl:max-w-4xl flex flex-col gap-2">
        {errorText ? <p className="inline-error">{errorText}</p> : null}
        <form
          className="relative flex w-full items-end rounded-2xl border border-border bg-bg-raised transition-colors focus-within:border-accent shadow-sm"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <textarea
            ref={promptRef}
            value={value}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-text text-smd leading-[1.55] py-3.5 pl-4 pr-14 min-h-[52px] max-h-[240px] placeholder:text-text-faint"
            placeholder="问点什么…"
            onChange={(event) => setValue(event.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey || composing || event.nativeEvent.isComposing) return;
              event.preventDefault();
              send();
            }}
          />
          <button
            type={sending ? "button" : "submit"}
            className={["btn-circle absolute bottom-2.5 right-2.5", sending || value.trim() ? "is-active" : ""].join(" ")}
            disabled={!sending && !value.trim()}
            title={sending ? "停止生成" : "发送(Enter)"}
            onClick={sending ? stop : undefined}
          >
            {sending ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1.5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-xxs text-text-faint text-center">
          <kbd className="kbd">Enter</kbd> 发送 · <kbd className="kbd">Shift</kbd>+<kbd className="kbd">Enter</kbd> 换行
        </p>
      </div>
    </div>
  );
}
