import type { ComponentType } from "react";

// 前端 app 注册表。新增 app = 加一行(并在 server/apps/registry.ts 加后端)。
export type AppDef = {
  id: string;
  name: string;
  icon: "notepad" | "todo" | "ledger" | string;
  color?: string;
  load: () => Promise<{ default: ComponentType }>;
};

export const apps: AppDef[] = [
  { id: "notepad", name: "记事本", icon: "notepad", color: "#FFD21E", load: () => import("./notepad") },
  { id: "todo", name: "待办", icon: "todo", color: "#34d399", load: () => import("./todo") },
  { id: "ledger", name: "记账本", icon: "ledger", color: "#60a5fa", load: () => import("./ledger") },
];

export const getApp = (id: string): AppDef | null => apps.find((app) => app.id === id) || null;
