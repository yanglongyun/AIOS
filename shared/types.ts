export type AnyRecord = Record<string, any>;

export interface ToolFunctionCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface AgentMessage {
  role: string;
  content?: string | null;
  tool_calls?: ToolFunctionCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ChatOptions {
  provider?: string;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  send?: (message: AnyRecord) => void;
  signal?: AbortSignal;
  maxRounds?: number;
  enableToolResultTruncate?: boolean;
  toolResultMaxChars?: number;
}

export interface AppSettings {
  provider: string;
  systemPrompt: string;
  language: string;
  contextRounds: number;
  apiUrl: string;
  apiKey: string;
  model: string;
  enableToolResultTruncate: boolean;
  toolResultMaxChars: number;
  enableToolLoopLimit: boolean;
  toolMaxRounds: number;
}

export interface TaskScheduleRow {
  id: number;
  name: string;
  prompt: string;
  run_at: string | null;
  cron: string | null;
  enabled: number;
  last_run_at: string | null;
  last_task_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CookieSerializeOptions {
  path?: string;
  maxAge?: number;
  httpOnly?: boolean;
  sameSite?: string;
  secure?: boolean;
}
