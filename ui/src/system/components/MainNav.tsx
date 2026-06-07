import { Bot, CheckSquare, ListChecks, MessageSquare, NotebookPen, Plus, Settings, Wallet } from "lucide-react";
import { apps } from "../../apps/registry";
import { useLayout } from "../state/layout";
import { Logo } from "./Icon";
import type { RouteName } from "./AppShell";

const appIconMap: Record<string, typeof MessageSquare> = {
  notepad: NotebookPen,
  todo: CheckSquare,
  ledger: Wallet,
};

const iconTone: Record<string, string> = {
  chat: "text-amber-600 dark:text-amber-400",
  notepad: "text-amber-500 dark:text-amber-300",
  todo: "text-emerald-500 dark:text-emerald-400",
  ledger: "text-sky-500 dark:text-sky-400",
};

const navButtonClass = (active: boolean, center = false) =>
  [
    "flex w-full items-center gap-2.5 rounded-md border-l-2 px-3 text-left text-sm transition",
    center ? "justify-center" : "",
    active
      ? "border-amber-500 bg-slate-200 font-semibold text-slate-950 dark:bg-neutral-800 dark:text-neutral-100"
      : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100",
  ].join(" ");

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100";

export function MainNav({
  route,
  setRoute,
}: {
  route: RouteName;
  setRoute: (route: RouteName) => void;
}) {
  const layout = useLayout();
  const appEntries = [
    { id: "chat", name: "对话", route: "chat", icon: MessageSquare },
    ...apps.map((app) => ({
      id: app.id,
      name: app.name,
      route: `app/${app.id}`,
      icon: appIconMap[app.icon] || Bot,
    })),
  ];

  return (
    <aside
      className={[
        "flex flex-col shrink-0 transition-[width,transform] duration-300 ease-out",
        "max-md:fixed max-md:top-0 max-md:left-0 max-md:bottom-0 max-md:w-[260px] max-md:z-50",
        "max-md:rounded-r-2xl max-md:border-r max-md:border-slate-200 max-md:shadow-2xl md:static dark:border-neutral-800",
        layout.mobileNavOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        "w-[260px] bg-white dark:bg-neutral-950",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5 pt-4 pb-4 select-none px-4">
        <Logo />
        <div className="flex flex-col leading-tight min-w-0 flex-1">
          <strong className="truncate text-base font-semibold tracking-tight text-slate-950 dark:text-neutral-100">AIOS</strong>
          <span className="truncate text-[10px] text-slate-500 dark:text-neutral-400">人工智能操作系统</span>
        </div>
        <button
          className={iconButtonClass}
          title="创建应用"
          onClick={() => {
            setRoute("create-app");
            layout.closeMobileNav();
          }}
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex flex-col px-2 flex-1 min-h-0 overflow-y-auto pt-1 gap-0.5">
        {appEntries.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`${navButtonClass(route === item.route)} py-2.5`}
              onClick={() => {
                setRoute(item.route);
                layout.closeMobileNav();
              }}
            >
              <span className={`grid h-4 w-4 shrink-0 place-items-center ${iconTone[item.id] || "text-slate-500 dark:text-neutral-400"}`} aria-hidden="true">
                <Icon size={16} strokeWidth={1.8} />
              </span>
              <span className="flex-1 min-w-0 truncate">{item.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-1.5 border-t border-slate-200 px-2 py-2.5 dark:border-neutral-800">
        <button
          className={`${navButtonClass(route === "tasks", true)} py-2`}
          onClick={() => {
            setRoute("tasks");
            layout.closeMobileNav();
          }}
        >
          <ListChecks size={16} />
          <span>任务</span>
        </button>
        <button
          className={`${navButtonClass(route === "settings", true)} py-2`}
          onClick={() => {
            setRoute("settings");
            layout.closeMobileNav();
          }}
        >
          <Settings size={16} />
          <span>设置</span>
        </button>
      </div>
    </aside>
  );
}
