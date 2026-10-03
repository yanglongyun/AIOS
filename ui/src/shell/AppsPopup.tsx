// 应用中心:右上角 ⚏ 弹出的谷歌式九宫格。内置应用在前,装上的应用在后。
import { useEffect, useRef } from "react";
import type { AppInfo } from "../api/apps";
import { AlertTriangle, AppWindow } from "../components/ui/icons";
import { BUILTIN_APPS } from "./builtins";

export function AppsPopup({ open, activeId, apps, onPick, onClose }: {
  open: boolean;
  activeId: string;
  apps: AppInfo[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (ref.current?.contains(target) || target.closest("[data-apps-trigger]")) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const tile = (id: string, name: string, icon: React.ReactNode, color: string, extra?: React.ReactNode) => (
    <button key={id} type="button" onClick={() => onPick(id)} title={name}
      className={`group flex flex-col items-center gap-2 rounded-2xl px-1 py-3 transition-colors hover:bg-bg-hover ${activeId === id ? "bg-accent-soft" : ""}`}>
      <span className="relative grid size-12 place-items-center rounded-2xl text-white shadow-sm" style={{ background: color }}>
        {icon}{extra}
      </span>
      <span className="w-full truncate text-center text-[12.5px] text-text">{name}</span>
    </button>
  );

  return (
    <div ref={ref} role="dialog" aria-label="应用中心"
      className="aios-pop fixed right-3 top-14 z-50 flex max-h-[calc(100dvh-80px)] w-[360px] max-w-[calc(100vw-24px)] flex-col rounded-[28px] bg-bg-inset p-2 shadow-2xl">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-bg">
        <header className="px-5 pb-2 pt-4 text-[16px] font-medium text-text">应用中心</header>
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-1 overflow-y-auto px-3 pb-4">
          {BUILTIN_APPS.map((app) => tile(app.id, app.name, <app.icon size={22} />, app.color))}
          {apps.map((app) => tile(
            `ext:${app.id}`, app.name,
            app.hasIcon ? <img src={`/api/apps/icon?id=${encodeURIComponent(app.id)}`} alt="" className="size-12 rounded-2xl object-cover" /> : <AppWindow size={22} />,
            app.hasIcon ? "transparent" : "#7b61ff",
            app.invalid ? <AlertTriangle size={14} className="absolute -right-1 -top-1 rounded-full bg-bg text-danger" /> : null,
          ))}
        </div>
        {!apps.length && <p className="px-5 pb-4 text-[11.5px] leading-relaxed text-text-faint">
          还没有装别的应用。在聊天里让 AI 帮你做一个,做好就会出现在这里。
        </p>}
      </div>
    </div>
  );
}
