import type { ReactNode } from "react";
import { getApp } from "../../apps/registry";
import { useConversation } from "../state/conversation";
import { useLayout } from "../state/layout";
import { useTask } from "../state/task";
import { MainNav } from "./MainNav";
import { MobileTopBar } from "./MobileTopBar";

export type WorkspaceRoute =
  | "chat" | "tasks" | "memories" | "skills" | "settings";

// app 路由形如 "app/notepad",所以路由整体放宽到 string
export type RouteName = WorkspaceRoute | string;

export type NavItem = {
  name: WorkspaceRoute;
  label: string;
  icon: "chat" | "tasks" | "memories" | "skills" | "settings";
};

export const navItems: NavItem[] = [
  { name: "chat", label: "对话", icon: "chat" },
  { name: "tasks", label: "任务", icon: "tasks" },
  { name: "memories", label: "记忆", icon: "memories" },
  { name: "skills", label: "技能", icon: "skills" },
  { name: "settings", label: "设置", icon: "settings" },
];

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
  const conversation = useConversation();
  const task = useTask();

  const currentNav = navItems.find((item) => item.name === route);
  const currentApp = route.startsWith("app/") ? getApp(route.slice(4)) : null;
  const mobileTitle =
    route === "chat"
      ? conversation.current?.title || "新会话"
      : route === "tasks"
        ? task.current?.name || "任务"
        : currentApp?.name || currentNav?.label || "";
  const mobileSubTitle =
    route === "chat" && conversation.current
      ? `#${conversation.current.id}`
      : route === "tasks" && task.current
        ? `#${task.current.id}`
        : "";

  const openCurrentMobileSheet = () => {
    if (route === "chat") layout.openMobileChatList();
    if (route === "tasks") layout.openMobileTasksList();
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-bg overflow-hidden">
      <MobileTopBar
        title={mobileTitle}
        subTitle={mobileSubTitle}
        hasSheet={route === "chat" || route === "tasks"}
        openSheet={openCurrentMobileSheet}
      />
      <MainNav route={route} setRoute={setRoute} />
      {layout.mobileNavOpen ? (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={layout.closeMobileNav} />
      ) : null}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-bg overflow-hidden">{children}</main>
    </div>
  );
}
