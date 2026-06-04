import { useEffect, useState } from "react";
import { AppShell, type RouteName } from "./system/components/AppShell";
import { ConversationProvider } from "./system/state/conversation";
import { LayoutProvider } from "./system/state/layout";
import { SocketProvider } from "./system/state/socket";
import { TaskProvider } from "./system/state/task";
import { ThemeProvider } from "./system/state/theme";
import { ChatView } from "./system/views/ChatView";
import { MemoriesView } from "./system/views/MemoriesView";
import { SettingsView } from "./system/views/SettingsView";
import { SkillsView } from "./system/views/SkillsView";
import { TasksView } from "./system/views/TasksView";
import { CreateAppView } from "./system/views/CreateAppView";
import { AppHost } from "./system/components/AppHost";

const workspaceRoutes = new Set<RouteName>([
  "chat", "tasks", "memories", "skills", "settings",
]);

const readRoute = (): RouteName => {
  const value = window.location.hash.replace(/^#\/?/, "");
  if (value.startsWith("app/")) return value;
  if (value === "create-app") return value;
  return workspaceRoutes.has(value) ? value : "chat";
};

export function App() {
  const [route, setRouteState] = useState<RouteName>(readRoute);

  useEffect(() => {
    const onHashChange = () => setRouteState(readRoute());
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.location.hash = "/chat";
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setRoute = (next: RouteName) => {
    window.location.hash = `/${next}`;
    setRouteState(next);
  };

  return (
    <ThemeProvider>
      <LayoutProvider>
        <SocketProvider>
          <ConversationProvider>
            <TaskProvider>
              <AppShell route={route} setRoute={setRoute}>
                {route === "chat" ? <ChatView /> : null}
                {route === "tasks" ? <TasksView setRoute={setRoute} /> : null}
                {route === "memories" ? <MemoriesView /> : null}
                {route === "skills" ? <SkillsView /> : null}
                {route === "settings" ? <SettingsView /> : null}
                {route === "create-app" ? <CreateAppView setRoute={setRoute} /> : null}
                {route.startsWith("app/") ? <AppHost id={route.slice(4)} /> : null}
              </AppShell>
            </TaskProvider>
          </ConversationProvider>
        </SocketProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
}
