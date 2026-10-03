import type { ComponentType } from "react";
import { Activity, Folder, MessageSquare, Settings } from "../components/ui/icons";

/** 内置应用:跟宿主一起发布,直接是界面里的 React 组件。其余应用走应用机制(manifest + 独立进程)。 */
export type BuiltinApp = {
  id: string;
  name: string;
  color: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

export const BUILTIN_APPS: BuiltinApp[] = [
  { id: "chat", name: "聊天", color: "#1a73e8", icon: MessageSquare },
  { id: "files", name: "文件", color: "#188038", icon: Folder },
  { id: "status", name: "状态", color: "#e37400", icon: Activity },
  { id: "settings", name: "设置", color: "#5f6368", icon: Settings },
];

export const DEFAULT_APP = "chat";
