import { useEffect, useState } from "react";
import { authApi } from "./api/auth";
import { Login } from "./shell/Login";
import { Shell } from "./shell/Shell";

type AuthState = Awaited<ReturnType<typeof authApi.state>>;

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  useEffect(() => {
    authApi.state().then(setAuth).catch(() => setAuth({ authenticated: false, locked: false, remaining: 5 }));
  }, []);
  if (!auth) return <div className="h-dvh bg-bg" />;
  return auth.authenticated ? <Shell /> : <Login initial={auth} onDone={() => setAuth({ ...auth, authenticated: true })} />;
}
