import { request, jsonBody } from "../lib/http";

export type DiskInfo = { path: string; total: number; free: number };
export type ProcessInfo = {
  id: string; command: string; cwd: string; reason: string; pid: number | null;
  status: "running" | "stopped" | "exited" | "error"; started_at: string; ended_at: string | null;
  exit_code: number | null; ports: number[]; log_file: string | null;
};
export type SystemStatus = {
  aios: { version: string; node: string; uptime: number; dataHome: string; pid: number };
  machine: {
    hostname: string; platform: string; arch: string; uptime: number; cpus: number; cpuModel: string;
    cpuUsage: number; load: number[]; memory: { total: number; free: number }; disks: DiskInfo[];
  };
  apps: { id: string; name: string; invalid: string; mode: string; status: string; error: string; port: number }[];
  processes: ProcessInfo[];
  runningChats: string[];
};

export const systemApi = {
  status: () => request<SystemStatus>("/api/system/status"),
  desktop: () => request<{ available: boolean }>("/api/system/desktop").then((r) => r.available),
  killProcess: (id: string) => request<{ ok: boolean }>("/api/system/processes/kill", { method: "POST", ...jsonBody({ id }) }),
};
