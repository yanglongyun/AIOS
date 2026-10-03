// 状态:这台机器和 AIOS 自己的运行情况。只在打开时轮询。
import { useEffect, useState } from "react";
import { appsApi } from "../api/apps";
import { type SystemStatus, systemApi } from "../api/system";
import { dialog } from "../components/ui";
import { Activity, RotateCw, Square } from "../components/ui/icons";
import type { AppProps } from "./types";

const bytes = (n: number) => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
};
const duration = (sec: number) => {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d ? `${d} 天 ${h} 小时` : h ? `${h} 小时 ${m} 分` : `${m} 分钟`;
};

function Meter({ label, used, total, text }: { label: string; used: number; total: number; text: string }) {
  const ratio = total > 0 ? Math.min(1, used / total) : 0;
  const color = ratio > 0.9 ? "bg-danger" : ratio > 0.75 ? "bg-warning" : "bg-accent";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-text-dim">{label}</span><span className="text-text tabular-nums">{text}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-inset"><div className={`h-full rounded-full ${color}`} style={{ width: `${ratio * 100}%` }} /></div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl bg-bg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-bg-inset dark:shadow-none"><h2 className="mb-4 text-[14px] font-medium text-text">{title}</h2>{children}</section>;
}

const STATUS_LABEL: Record<string, [string, string]> = {
  ready: ["运行中", "text-success"], starting: ["启动中", "text-warning"], stopped: ["未运行", "text-text-faint"],
  failed: ["失败", "text-danger"], running: ["运行中", "text-success"], exited: ["已退出", "text-text-faint"], error: ["出错", "text-danger"],
};

export function StatusApp({ active }: AppProps) {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    let stop = false;
    const load = () => systemApi.status().then((s) => { if (!stop) { setData(s); setError(""); } })
      .catch((e) => { if (!stop) setError(e instanceof Error ? e.message : "读取失败"); });
    void load();
    const timer = setInterval(load, 3000);
    return () => { stop = true; clearInterval(timer); };
  }, [active, tick]);

  if (!data) return <div className="flex flex-1 items-center justify-center text-[13px] text-text-faint">{error || "正在读取…"}</div>;
  const { machine, aios, apps, processes } = data;
  const memUsed = machine.memory.total - machine.memory.free;
  const live = processes.filter((p) => p.status === "running");

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-bg-raised">
      <div className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-2 md:p-6">
        <Card title="机器">
          <div className="space-y-4">
            <Meter label={`CPU · ${machine.cpus} 核`} used={machine.cpuUsage} total={1} text={`${Math.round(machine.cpuUsage * 100)}%`} />
            <Meter label="内存" used={memUsed} total={machine.memory.total} text={`${bytes(memUsed)} / ${bytes(machine.memory.total)}`} />
            {machine.disks.map((d) => (
              <Meter key={d.path} label={`磁盘 ${d.path}`} used={d.total - d.free} total={d.total} text={`${bytes(d.total - d.free)} / ${bytes(d.total)}`} />
            ))}
          </div>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
            <dt className="text-text-faint">主机</dt><dd className="truncate text-text">{machine.hostname}</dd>
            <dt className="text-text-faint">系统</dt><dd className="truncate text-text">{machine.platform} · {machine.arch}</dd>
            <dt className="text-text-faint">负载</dt><dd className="text-text tabular-nums">{machine.load.map((x) => x.toFixed(2)).join(" / ")}</dd>
            <dt className="text-text-faint">已开机</dt><dd className="text-text">{duration(machine.uptime)}</dd>
          </dl>
        </Card>

        <Card title="AIOS">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
            <dt className="text-text-faint">版本</dt><dd className="text-text">{aios.version}</dd>
            <dt className="text-text-faint">Node</dt><dd className="text-text">{aios.node}</dd>
            <dt className="text-text-faint">已运行</dt><dd className="text-text">{duration(aios.uptime)}</dd>
            <dt className="text-text-faint">数据目录</dt><dd className="truncate font-mono text-text">{aios.dataHome}</dd>
            <dt className="text-text-faint">进行中对话</dt><dd className="text-text">{data.runningChats.length}</dd>
          </dl>
        </Card>

        <Card title={`应用 (${apps.length})`}>
          {!apps.length ? <p className="text-[12.5px] text-text-faint">还没有安装应用。</p> : (
            <ul className="divide-y divide-border">
              {apps.map((app) => {
                const [label, color] = app.invalid ? ["配置有误", "text-danger"] : STATUS_LABEL[app.status] || [app.status, "text-text-faint"];
                return (
                  <li key={app.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] text-text">{app.name} <span className="text-text-faint">· {app.id}</span></div>
                      <div className={`truncate text-[12px] ${color}`}>{label}{app.port ? ` · 端口 ${app.port}` : ""}{app.invalid || app.error ? ` · ${app.invalid || app.error}` : ""}</div>
                    </div>
                    {app.status === "ready" && <>
                      <button title="重启" onClick={() => void appsApi.restartApp(app.id).then(() => setTick((n) => n + 1))} className="rounded-full p-2 text-text-dim hover:bg-bg-hover"><RotateCw size={14} /></button>
                      <button title="停止" onClick={() => void appsApi.stopApp(app.id).then(() => setTick((n) => n + 1))} className="rounded-full p-2 text-text-dim hover:bg-bg-hover hover:text-danger"><Square size={14} /></button>
                    </>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`后台进程 (${live.length} 个运行中)`}>
          {!processes.length ? <p className="text-[12.5px] text-text-faint">AI 用 bash 起的后台进程会显示在这里。</p> : (
            <ul className="divide-y divide-border">
              {processes.slice().reverse().map((p) => {
                const [label, color] = STATUS_LABEL[p.status] || [p.status, "text-text-faint"];
                return (
                  <li key={p.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[12.5px] text-text" title={p.command}>{p.command}</div>
                      <div className={`truncate text-[12px] ${color}`}>{label}{p.pid ? ` · pid ${p.pid}` : ""}{p.ports.length ? ` · 端口 ${p.ports.join(",")}` : ""}{p.exit_code !== null ? ` · 退出码 ${p.exit_code}` : ""}</div>
                    </div>
                    {p.status === "running" && (
                      <button title="停止" onClick={async () => {
                        if (await dialog.confirm(`停止这个进程?\n${p.command}`, { danger: true, confirmText: "停止" })) {
                          await systemApi.killProcess(p.id); setTick((n) => n + 1);
                        }
                      }} className="rounded-full p-2 text-text-dim hover:bg-bg-hover hover:text-danger"><Square size={14} /></button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
      {error && <p className="flex items-center justify-center gap-1.5 pb-4 text-[12px] text-danger"><Activity size={12} />{error}</p>}
    </div>
  );
}
