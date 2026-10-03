import { request, jsonBody } from "../lib/http";

export const authApi = {
  state: () => request<{ authenticated: boolean; locked: boolean; remaining: number; message?: string }>("/api/auth/state"),
  login: (password: string) => request<{ ok: boolean }>("/api/auth/login", { method: "POST", ...jsonBody({ password }) }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  changePassword: (current: string, next: string) =>
    request<{ ok: boolean }>("/api/auth/password", { method: "POST", ...jsonBody({ current, next }) }),
};
