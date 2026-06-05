export type Conversation = {
  id: string;
  title: string;
  summary?: string;
  createdAt?: string;
  created_at?: string;
};

export type Message = {
  _id?: number | string;
  id?: number | string;
  role: "system" | "user" | "assistant" | "tool" | string;
  content?: string;
  message?: string;
  memo?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  created_at?: string;
  meta?: Record<string, any>;
  _meta?: Record<string, any>;
};

export type MonitorMeta = {
  title: string;
  event: string;
  body: string;
};

export type DisplayMessage = {
  role: "user" | "assistant" | "tool";
  content?: string;
  _id: string;
  memo?: string;
  streaming?: boolean;
  toolCallId?: string;
  toolName?: string;
  toolSub?: string;
  shell?: boolean;
  command?: string;
  args?: string;
  result?: string | null;
  expanded?: boolean;
  orphan?: boolean;
  monitor?: MonitorMeta;
};

export type ToolCall = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type Memory = {
  id: number;
  title: string;
  description?: string;
  content: string;
  creator?: string;
  visibility?: "hidden" | "starred" | "pinned" | string;
  enabled?: boolean | number;
  created_at?: string;
};

export type Task = {
  id: number;
  name: string;
  prompt?: string;
  detail?: string;
  status: string;
  response?: string;
  error?: string;
  conversation_id?: string;
  created_at?: string;
  finished_at?: string;
};

export type Settings = {
  apiUrl: string;
  apiKey: string;
  model: string;
  provider?: string;
  system: string;
  contextTurns: number;
};

export type Skill = {
  name: string;
  description: string;
  path: string;
};

const request = async <T>(path: string, options: RequestInit = {}) => {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `${response.status} ${response.statusText}`);
  }
  return data as T;
};

export const api = {
  health: () => request<{ ok: boolean; port: number }>("/health"),
  listConversations: (search = "") =>
    request<{ conversations: Conversation[] }>(
      `/api/chats${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),
  createConversation: (title: string) =>
    request<{ conversation: Conversation }>("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),
  deleteConversation: (id: string) =>
    request<{ ok: boolean }>(`/api/chats?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  updateConversationTitle: (id: string, title: string) =>
    request<{ conversation: Conversation }>(`/api/chats?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),
  listMessages: (conversationId: string) =>
    request<{ messages: Message[] }>(
      `/api/messages?conversationId=${encodeURIComponent(conversationId)}`,
    ),
  getSettings: () => request<{ settings: Settings; defaultSystem?: string }>("/api/settings"),
  saveSettings: (settings: Settings) =>
    request<{ ok: boolean }>("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }),
  listTasks: () => request<{ tasks: Task[] }>("/api/tasks"),
  createTask: (payload: { name: string; detail: string }) =>
    request<{ taskId: number; conversationId: string }>("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  abortTask: (id: number) =>
    request<{ ok: boolean; task?: Task }>(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "aborted" }),
    }),
  listMemories: () => request<{ memories: Memory[] }>("/api/memories"),
  listSkills: () => request<{ skills: Skill[] }>("/api/skills"),
  createMemory: (payload: Pick<Memory, "title" | "description" | "content" | "visibility">) =>
    request<{ ok: boolean; memory?: Memory }>("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateMemory: (id: number, payload: Partial<Memory>) =>
    request<{ ok: boolean; memory?: Memory }>(`/api/memories?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteMemory: (id: number) =>
    request<{ ok: boolean }>(`/api/memories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};
