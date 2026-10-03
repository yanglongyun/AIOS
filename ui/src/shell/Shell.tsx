// 壳:一次全屏显示一个应用。顶栏右上角 ⚏ 打开应用中心,在应用之间切换(谷歌式)。
// 内置应用第一次打开后常驻挂载(切走只是隐藏),对话草稿、文件树展开状态都不丢。
import { useCallback, useEffect, useState } from "react";
import { type AppInfo, appsApi } from "../api/apps";
import { ChatApp } from "../apps/ChatApp";
import { DesktopApp } from "../apps/DesktopApp";
import { FilesApp } from "../apps/FilesApp";
import { SettingsApp } from "../apps/SettingsApp";
import { StatusApp } from "../apps/StatusApp";
import { AppPanel } from "../components/apps/AppPanel";
import { DialogHost, ToastHost, showToast } from "../components/ui";
import { AppWindow, LayoutGrid, Menu } from "../components/ui/icons";
import { currentAppId, navigate, onNavigate, openPath } from "../lib/nav";
import { useSocket } from "../ws";
import { BUILTIN_APPS, DEFAULT_APP } from "./builtins";
import { AppsPopup } from "./AppsPopup";

const WITH_NAV = new Set(["chat", "files"]);

export function Shell() {
  const socket = useSocket();
  const [appId, setAppId] = useState(() => currentAppId() || DEFAULT_APP);
  const [visited, setVisited] = useState<Set<string>>(() => new Set([currentAppId() || DEFAULT_APP]));
  const [popupOpen, setPopupOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  // 宽屏上左栏收起/展开(汉堡切换),记在本机
  const [railCollapsed, setRailCollapsed] = useState(() => { try { return localStorage.getItem("aios.railCollapsed") === "1"; } catch { return false; } });
  const toggleNav = () => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      setRailCollapsed((v) => { try { localStorage.setItem("aios.railCollapsed", v ? "0" : "1"); } catch { /* 存不了就算了 */ } return !v; });
    } else setNavOpen((v) => !v);
  };
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [openRequest, setOpenRequest] = useState<{ path: string; seq: number } | null>(null);

  useEffect(() => {
    if (!currentAppId()) history.replaceState(null, "", `/app/${DEFAULT_APP}`);
    return onNavigate(({ appId: next, path }) => {
      const id = next || DEFAULT_APP;
      setAppId(id);
      setVisited((s) => (s.has(id) ? s : new Set(s).add(id)));
      setNavOpen(false);
      if (path) setOpenRequest((r) => ({ path, seq: (r?.seq || 0) + 1 }));
    });
  }, []);

  const loadApps = useCallback(() => { void appsApi.listApps().then(setApps).catch(() => {}); }, []);
  useEffect(() => {
    loadApps();
    const offs = [
      socket.on("apps_changed", loadApps),
      socket.on("app_notify", (p: any) => { if (p?.text) showToast(`${p.appName || p.appId || "应用"}:${p.text}`); }),
    ];
    return () => offs.forEach((off) => off());
  }, [socket, loadApps]);

  // 对话正文里的本机路径(markdown.ts 打上 data-path):点了在「文件」里打开
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.(".prose [data-path]") as HTMLElement | null;
      if (!el?.dataset.path) return;
      e.preventDefault();
      openPath(el.dataset.path);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // 告诉服务端用户正看着哪个应用,拼进下一轮提示词
  useEffect(() => {
    const builtin = BUILTIN_APPS.find((a) => a.id === appId);
    const ext = appId.startsWith("ext:") ? apps.find((a) => `ext:${a.id}` === appId) : null;
    const tab = ext ? { id: appId, kind: "app", title: ext.name, appId: ext.id, active: true }
      : { id: appId, kind: appId, title: builtin?.name || appId, active: true };
    socket.send({ type: "workspace_state", workspace: { groups: [{ id: "main", active: true, tabs: [tab] }] } });
  }, [socket, appId, apps]);

  const builtin = BUILTIN_APPS.find((a) => a.id === appId);
  const ext = appId.startsWith("ext:") ? apps.find((a) => `ext:${a.id}` === appId) : null;
  const title = builtin?.name || ext?.name || "AIOS";
  const Icon = builtin?.icon || AppWindow;
  const closeNav = useCallback(() => setNavOpen(false), []);
  const common = (id: string) => ({ socket, active: appId === id, navOpen: navOpen && appId === id, railCollapsed, onCloseNav: closeNav });
  const view = (id: string, node: React.ReactNode) =>
    visited.has(id) ? <div key={id} className={appId === id ? "flex min-h-0 min-w-0 flex-1" : "hidden"}>{node}</div> : null;

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-bg text-text">
      <header className="flex h-14 shrink-0 items-center gap-1 bg-bg px-2">
        {WITH_NAV.has(appId) && (
          <button type="button" onClick={toggleNav} title="菜单" aria-label="菜单"
            className="grid size-10 place-items-center rounded-full text-text-dim transition-colors hover:bg-bg-hover"><Menu size={22} /></button>
        )}
        <span className={`grid size-8 place-items-center rounded-full text-white ${WITH_NAV.has(appId) ? "ml-1" : "ml-2"}`} style={{ background: builtin?.color || "#7b61ff" }}>
          <Icon size={17} />
        </span>
        <span className="ml-2 truncate text-[18px] text-text">{title}</span>
        <div className="flex-1" />
        <button type="button" data-apps-trigger onClick={() => setPopupOpen((v) => !v)} title="所有应用"
          className={`grid size-10 place-items-center rounded-full text-text-dim transition-colors hover:bg-bg-hover ${popupOpen ? "bg-bg-hover text-text" : ""}`}>
          <LayoutGrid size={20} />
        </button>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {view("chat", <ChatApp {...common("chat")} />)}
        {view("files", <FilesApp {...common("files")} openRequest={openRequest} />)}
        {view("desktop", <DesktopApp {...common("desktop")} />)}
        {view("status", <StatusApp {...common("status")} />)}
        {view("settings", <SettingsApp {...common("settings")} />)}
        {ext && <div key={appId} className="flex min-h-0 min-w-0 flex-1"><AppPanel tab={{ appId: ext.id, title: ext.name }} socket={socket} /></div>}
        {appId.startsWith("ext:") && !ext && <div className="flex flex-1 items-center justify-center text-[13px] text-text-faint">应用不存在或已删除</div>}
        {!builtin && !appId.startsWith("ext:") && <div className="flex flex-1 items-center justify-center text-[13px] text-text-faint">没有这个应用</div>}
      </div>

      <AppsPopup open={popupOpen} activeId={appId} apps={apps} onClose={() => setPopupOpen(false)}
        onPick={(id) => { setPopupOpen(false); navigate({ appId: id }); }} />
      <DialogHost />
      <ToastHost />
    </div>
  );
}
