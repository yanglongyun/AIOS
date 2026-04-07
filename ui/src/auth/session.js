let checked = false;
let authed = false;
const clearAuthCache = () => {
  checked = false;
  authed = false;
};
const checkAuth = async () => {
  try {
    const res = await fetch("/aios/api/auth/me", { credentials: "include" });
    const data = await res.json();
    authed = Boolean(res.ok && data?.success);
    checked = true;
    return {
      reachable: true,
      authenticated: authed
    };
  } catch {
    return {
      reachable: false,
      authenticated: null
    };
  }
};
const ensureAuth = async () => {
  return checkAuth();
};
export {
  checkAuth,
  clearAuthCache,
  ensureAuth
};
