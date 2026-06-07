export type Chat = {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  message_count?: number;
};

export type Message = {
  id?: number | string;
  role: "system" | "user" | "assistant" | "tool" | string;
  content?: string;
  memo?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  created_at?: string;
};

export type ChatMessageRecord = {
  id: number | string;
  source: "user" | "ai" | "tool" | "subscription" | string;
  message: Message;
  usage?: Record<string, any> | null;
  created_at?: string;
};

export type DisplayMessage = {
  role: "user" | "assistant" | "tool";
  source?: "user" | "ai" | "tool" | "subscription" | string;
  content?: string;
  id: string;
  memo?: string;
  usage?: Record<string, any>;
  streaming?: boolean;
  toolCallId?: string;
  toolName?: string;
  toolSummary?: string;
  toolSub?: string;
  shell?: boolean;
  command?: string;
  args?: string;
  result?: string | null;
  expanded?: boolean;
  orphan?: boolean;
};

export type ToolCall = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};
