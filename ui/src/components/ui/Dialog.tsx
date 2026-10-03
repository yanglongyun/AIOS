// 全局对话框:提示 / 确认 / 输入,全产品一套(Notion 风)。
// window.prompt 在 Electron 里根本不支持(静默无反应),confirm/alert 也是系统原生脸;
// 统一收编成 Promise API:dialog.alert / dialog.confirm / dialog.prompt。
// DialogHost 在 App 顶层挂一次;并发请求排队,一次只显示一个。
import { useEffect, useRef, useState } from "react";

type DialogKind = "alert" | "confirm" | "prompt";

export type DialogOptions = {
  /** 粗体标题(可选;不给就只有正文)。 */
  title?: string;
  /** 确认按钮红色(删除/覆盖等危险动作)。 */
  danger?: boolean;
  confirmText?: string;
  cancelText?: string;
  // prompt 专用
  placeholder?: string;
  defaultValue?: string;
};

type PendingDialog = DialogOptions & {
  kind: DialogKind;
  message: string;
  resolve: (value: any) => void;
};

let enqueue: ((req: PendingDialog) => void) | null = null;

const request = (kind: DialogKind, message: string, opts: DialogOptions = {}) =>
  new Promise<any>((resolve) => {
    const req: PendingDialog = { kind, message, ...opts, resolve };
    if (enqueue) enqueue(req);
    else resolve(kind === "confirm" ? false : kind === "prompt" ? null : undefined); // Host 未挂载的兜底
  });

export const dialog = {
  alert: (message: string, opts: DialogOptions = {}) => request("alert", message, opts) as Promise<void>,
  confirm: (message: string, opts: DialogOptions = {}) => request("confirm", message, opts) as Promise<boolean>,
  prompt: (message: string, opts: DialogOptions = {}) => request("prompt", message, opts) as Promise<string | null>,
};

export function DialogHost() {
  const [queue, setQueue] = useState<PendingDialog[]>([]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const current = queue[0] || null;

  useEffect(() => {
    enqueue = (req) => setQueue((q) => [...q, req]);
    return () => { enqueue = null; };
  }, []);

  // 换弹窗时初始化输入值并聚焦(prompt 聚焦输入框并全选,其余聚焦确定钮)
  useEffect(() => {
    if (!current) return;
    if (current.kind === "prompt") {
      setValue(current.defaultValue ?? "");
      requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select(); });
    } else {
      requestAnimationFrame(() => okRef.current?.focus());
    }
  }, [current]);

  if (!current) return null;

  const settle = (result: any) => {
    current.resolve(result);
    setQueue((q) => q.slice(1));
  };
  const cancel = () => settle(current.kind === "confirm" ? false : current.kind === "prompt" ? null : undefined);
  const ok = () => settle(current.kind === "prompt" ? value : current.kind === "confirm" ? true : undefined);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 pt-[18vh]"
      onMouseDown={cancel}
      onKeyDown={(e) => {
        if (e.key === "Escape") { e.stopPropagation(); cancel(); }
        if (e.key === "Enter") { e.stopPropagation(); ok(); }
      }}
    >
      <div
        className="w-[400px] max-w-[90vw] rounded-[28px] bg-surface shadow-2xl shadow-black/20 p-6 flex flex-col gap-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {current.title && <div className="text-[20px] text-text">{current.title}</div>}
        {current.message && (
          <div className="text-[14px] leading-relaxed text-text-dim whitespace-pre-wrap break-words">{current.message}</div>
        )}
        {current.kind === "prompt" && (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={current.placeholder || ""}
            spellCheck={false}
            className="w-full h-11 px-4 rounded-xl border border-border-strong bg-surface text-[14px] text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors placeholder:text-text-faint"
          />
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          {current.kind !== "alert" && (
            <button
              onClick={cancel}
              className="px-4 h-10 rounded-full text-[14px] font-medium text-accent hover:bg-accent-soft/40 transition-colors"
            >
              {current.cancelText || "取消"}
            </button>
          )}
          <button
            ref={okRef}
            onClick={ok}
            className={[
              "px-5 h-10 rounded-full text-[14px] font-medium text-white transition-opacity hover:opacity-90",
              current.danger ? "bg-danger" : "bg-accent",
            ].join(" ")}
          >
            {current.confirmText || "确定"}
          </button>
        </div>
      </div>
    </div>
  );
}
