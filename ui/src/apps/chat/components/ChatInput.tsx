import { ArrowUp, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const errorClass = "m-0 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400";

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
  const active = sending || !!value.trim();

  useEffect(() => {
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  return (
    <div className="shrink-0 px-4 md:px-5 pb-4 md:pb-5 pt-2">
      <div className="mx-auto max-w-3xl xl:max-w-4xl flex flex-col gap-2">
        {errorText ? <p className={errorClass}>{errorText}</p> : null}
        <form
          className="relative flex w-full items-end rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 dark:border-neutral-800 dark:bg-neutral-900"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <textarea
            ref={promptRef}
            value={value}
            rows={1}
            className="max-h-[240px] min-h-[52px] flex-1 resize-none border-0 bg-transparent py-3.5 pl-4 pr-14 text-[0.94rem] leading-[1.55] text-slate-900 outline-none placeholder:text-slate-400 dark:text-neutral-100 dark:placeholder:text-neutral-500"
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
            className={[
              "absolute bottom-2.5 right-2.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
            ].join(" ")}
            disabled={!sending && !value.trim()}
            title={sending ? "停止生成" : "发送(Enter)"}
            onClick={sending ? stop : undefined}
          >
            {sending ? (
              <Square size={11} fill="currentColor" />
            ) : (
              <ArrowUp size={15} strokeWidth={2.5} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
