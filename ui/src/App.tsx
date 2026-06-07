import { useEffect, useState } from "react";
import { AppShell, type RouteName } from "./system/components/AppShell";
import { ChatProvider } from "./system/state/chat";
import { LayoutProvider } from "./system/state/layout";
import { ThemeProvider } from "./system/state/theme";
import ChatApp from "./apps/chat";
import { SettingsView } from "./system/views/settings";
import { TaskView } from "./system/views/tasks";
import { CreateAppView } from "./system/views/CreateAppView";
import { AppHost } from "./system/components/AppHost";

const workspaceRoutes = new Set<RouteName>([
  "chat", "tasks", "settings",
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
        <ChatProvider>
          <AppShell route={route} setRoute={setRoute}>
            {route === "chat" ? <ChatApp /> : null}
            {route === "tasks" ? <TaskView /> : null}
            {route === "settings" ? <SettingsView /> : null}
            {route === "create-app" ? <CreateAppView setRoute={setRoute} /> : null}
            {route.startsWith("app/") ? <AppHost id={route.slice(4)} /> : null}
          </AppShell>
        </ChatProvider>
      </LayoutProvider>
    </ThemeProvider>
  );
}
