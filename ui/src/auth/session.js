let checked = false;
let authed = false;

export const clearAuthCache = () => {
  checked = false;
  authed = false;
};

export const checkAuth = async () => {
  try {
    const res = await fetch('/aios/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    authed = Boolean(res.ok && data?.success);
  } catch {
    authed = false;
  }
  checked = true;
  return authed;
};

export const ensureAuth = async () => {
  return checkAuth();
};
