// 壳内导航:一次只显示一个应用,地址是 /app/<id>。
// 应用之间的跳转(比如对话里点了一个文件路径 → 打开「文件」)也走这里。
export type NavTarget = { appId: string; path?: string };

const NAV_EVENT = "aios:navigate";

export const currentAppId = () => {
  const m = location.pathname.match(/^\/app\/([^/]+)/);
  return m ? decodeURIComponent(m[1]) : "";
};

export const navigate = (target: NavTarget) => {
  const url = `/app/${encodeURIComponent(target.appId)}`;
  if (location.pathname !== url) history.pushState(null, "", url);
  window.dispatchEvent(new CustomEvent<NavTarget>(NAV_EVENT, { detail: target }));
};

export const onNavigate = (fn: (target: NavTarget) => void) => {
  const handler = (e: Event) => fn((e as CustomEvent<NavTarget>).detail);
  const onPop = () => fn({ appId: currentAppId() });
  window.addEventListener(NAV_EVENT, handler);
  window.addEventListener("popstate", onPop);
  return () => { window.removeEventListener(NAV_EVENT, handler); window.removeEventListener("popstate", onPop); };
};

/** 打开某个本机路径:交给「文件」应用。 */
export const openPath = (path: string) => navigate({ appId: "files", path });
