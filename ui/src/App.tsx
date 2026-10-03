import { useEffect, useState } from "react";
import { authApi } from "./api/auth";
import { Login } from "./shell/Login";
import { Shell } from "./shell/Shell";

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    authApi.state().then((s) => setAuthed(s.authenticated)).catch(() => setAuthed(false));
  }, []);
  if (authed === null) return <div className="h-dvh bg-bg" />;
  return authed ? <Shell /> : <Login onDone={() => setAuthed(true)} />;
}
