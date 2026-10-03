import { useState } from "react";
import { authApi } from "../api/auth";
import { Loader } from "../components/ui/icons";

export function Login({ initial, onDone }: { initial: { locked: boolean; remaining: number; message?: string }; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [locked, setLocked] = useState(initial.locked);
  const [error, setError] = useState(initial.locked ? initial.message || "登录已锁定" : "");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setError("");
    try { await authApi.login(password); onDone(); }
    catch (e) {
      const message = e instanceof Error ? e.message : "登录失败";
      setError(message);
      if (message.includes("已锁定")) setLocked(true);
      setPassword("");
    }
    finally { setBusy(false); }
  };
  return (
    <div className="flex h-dvh items-center justify-center bg-bg-inset px-4">
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }}
        className="w-full max-w-sm rounded-[28px] bg-bg px-7 pb-7 pt-8 shadow-xl">
        <div className="mb-1 text-[22px] font-semibold text-text">AIOS</div>
        <p className="mb-6 text-[13px] text-text-faint">
          输入密码继续。连续输错 5 次会锁定登录{!locked && initial.remaining < 5 ? `(还能再试 ${initial.remaining} 次)` : ""}。
        </p>
        <input type="password" autoFocus disabled={locked} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="密码" className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-[15px] text-text outline-none focus:border-accent" />
        {error && <p role="alert" className="mt-3 break-all text-[13px] leading-relaxed text-danger">{error}</p>}
        <button type="submit" disabled={busy || !password || locked}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-[15px] font-medium text-white hover:opacity-90 disabled:opacity-50">
          {busy && <Loader size={15} className="animate-spin" />}登录
        </button>
      </form>
    </div>
  );
}
