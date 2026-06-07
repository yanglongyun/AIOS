import type { ReactNode } from "react";
import { LayoutGrid, Menu, Plus } from "lucide-react";
import { getApp } from "../../apps/registry";
import { useChat } from "../state/chat";
import { useLayout } from "../state/layout";
import { MainNav } from "./MainNav";

export type WorkspaceRoute =
  | "chat" | "tasks" | "settings";

// app 路由形如 "app/notepad",所以路由整体放宽到 string
export type RouteName = WorkspaceRoute | string;

export type NavItem = {
  name: WorkspaceRoute;
  label: string;
  icon: "chat" | "tasks" | "settings";
};

export const navItems: NavItem[] = [
  { name: "chat", label: "对话", icon: "chat" },
  { name: "tasks", label: "任务", icon: "tasks" },
  { name: "settings", label: "设置", icon: "settings" },
];

const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100";

export function AppShell({
  children,
  route,
  setRoute,
}: {
  children: ReactNode;
  route: RouteName;
  setRoute: (route: RouteName) => void;
}) {
  const layout = useLayout();
  const chat = useChat();

  const currentNav = navItems.find((item) => item.name === route);
  const currentApp = route.startsWith("app/") ? getApp(route.slice(4)) : null;
  const title =
    route === "chat"
      ? "对话"
      : route === "tasks"
        ? "任务"
        : route === "create-app"
          ? "创建应用"
        : currentApp?.name || currentNav?.label || "";
  const subTitle =
    route === "chat" && chat.current
      ? `#${chat.current.id}`
      : route.startsWith("app/")
          ? `/apps/${route.slice(4)}`
          : route === "create-app"
            ? "从想法生成应用"
        : "";

  const emitChatAction = (name: "new" | "history") => {
    window.dispatchEvent(new CustomEvent(`aios:chat:${name}`));
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 md:flex-row dark:bg-neutral-950 dark:text-neutral-100">
      <MainNav route={route} setRoute={setRoute} />
      {layout.mobileNavOpen ? (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={layout.closeMobileNav} />
      ) : null}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-neutral-950">
        <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-slate-50/95 px-3 backdrop-blur md:px-5 dark:border-neutral-800 dark:bg-neutral-950/95">
          <button className={`md:hidden ${iconButtonClass}`} title="应用面板" onClick={layout.openMobileNav}>
            <LayoutGrid size={18} />
          </button>
          <div className="flex flex-col min-w-0 flex-1 leading-tight">
            <strong className="truncate text-sm font-semibold text-slate-950 dark:text-neutral-100">{title}</strong>
            {subTitle ? <span className="mt-1 truncate text-[10px] text-slate-500 dark:text-neutral-400">{subTitle}</span> : null}
          </div>
          {route === "chat" ? (
            <div className="flex items-center gap-1 shrink-0">
              <button className={iconButtonClass} title="新对话" onClick={() => emitChatAction("new")}>
                <Plus size={16} />
              </button>
              <button className={iconButtonClass} title="历史" onClick={() => emitChatAction("history")}>
                <Menu size={16} />
              </button>
            </div>
          ) : null}
        </header>
        {children}
      </main>
    </div>
  );
}
