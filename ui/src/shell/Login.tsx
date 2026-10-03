import { useState } from "react";
import { authApi } from "../api/auth";
import { Loader } from "../components/ui/icons";

export function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setError("");
    try { await authApi.login(password); onDone(); }
    catch (e) { setError(e instanceof Error ? e.message : "登录失败"); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex h-dvh items-center justify-center bg-bg-inset px-4">
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }}
        className="w-full max-w-sm rounded-[28px] bg-bg px-7 pb-7 pt-8 shadow-xl">
        <div className="mb-1 text-[22px] font-semibold text-text">AIOS</div>
        <p className="mb-6 text-[13px] text-text-faint">输入密码继续。首次启动的密码在服务器的控制台输出里,也保存在 ~/.aios/initial-password.txt。</p>
        <input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="密码" className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-text outline-none focus:border-accent" />
        {error && <p role="alert" className="mt-3 text-[13px] text-danger">{error}</p>}
        <button type="submit" disabled={busy || !password}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-50">
          {busy && <Loader size={15} className="animate-spin" />}登录
        </button>
      </form>
    </div>
  );
}
