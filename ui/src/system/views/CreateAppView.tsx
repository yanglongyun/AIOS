import { useState } from "react";
import { ArrowRight, Boxes, Cpu, Sparkles } from "lucide-react";
import type { RouteName } from "../components/AppShell";
import { useChat } from "../state/chat";
import { ensureWsConnected, sendWs } from "../state/ws";

const createChat = async (title: string) => {
  const response = await fetch("/api/chat/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data.chat as { id: string; title?: string };
};

const STEPS = [
  {
    icon: Sparkles,
    title: "1 · 描述需求",
    desc: "用一句话说清你想要的应用——做什么、关键界面、要存什么数据。越具体越好。",
  },
  {
    icon: Cpu,
    title: "2 · AI 生成全栈应用",
    desc: "AIOS 自动编写后端(独立 SQLite 库 + API 契约)、React 前端,以及 APP.md 说明书。",
  },
  {
    icon: Boxes,
    title: "3 · 注册并重启生效",
    desc: "写入 server/apps 与 ui/src/apps 并登记进前后端注册表,重启服务后即可在侧边栏「应用」里使用。",
  },
];

const cardClass = "rounded-lg border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-neutral-300";
const textareaClass =
  "min-h-32 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500";
const ghostButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";
const primaryButtonClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-slate-900 bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200";

export function CreateAppView({ setRoute }: { setRoute: (route: RouteName) => void }) {
  const chat = useChat();
  const [desc, setDesc] = useState("");
  const [hint, setHint] = useState("");

  const submit = async () => {
    const text = desc.trim();
    if (!text) return;
    const buildPrompt =
      `请在本系统(AIOS)创建一个应用。\n\n` +
      `需求:${text}\n\n` +
      `步骤:用 shell 按现有应用样板写「后端 + 前端 + APP.md」并注册到 ` +
      `server/apps/registry.ts 与 ui/src/apps/registry.ts(如需新图标改 MainNav 的 appIconMap)。` +
      `写完跑 npm run ui:build 自检,最后给我文件清单,并提醒我重启服务后即可在侧边栏使用。`;
    try {
      setHint("");
      const created = await createChat(`创建应用:${text.slice(0, 16)}`);
      const chatId = created?.id;
      if (!chatId) throw new Error("创建会话失败");
      chat.setCurrentChat(chatId, created);
      await ensureWsConnected();
      sendWs({ type: "chat.message", chatId, prompt: buildPrompt });
      setRoute("chat");
    } catch (error) {
      setHint(error instanceof Error ? error.message : "启动失败");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-10 flex flex-col gap-7">
        <header className="flex flex-col gap-2">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20">
            <Sparkles size={22} />
          </div>
          <h2 className="m-0 text-2xl font-semibold leading-tight text-slate-950 dark:text-neutral-100">创建应用</h2>
          <p className="m-0 text-sm leading-relaxed text-slate-500 dark:text-neutral-400">
            在 AIOS 里,应用不是装出来的,是<strong className="text-slate-950 dark:text-neutral-100">长出来的</strong>。
            你描述需求,AI 现场把它写进你的系统——前端、后端、数据库一应俱全。
          </p>
        </header>

        <div className="grid gap-3">
          {STEPS.map((step) => (
            <div key={step.title} className={`${cardClass} flex items-start gap-3 p-4`}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                <step.icon size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-slate-950 dark:text-neutral-100">{step.title}</span>
                <span className="text-xs leading-relaxed text-slate-500 dark:text-neutral-400">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={`${cardClass} flex flex-col gap-3 p-5`}>
          <label className={labelClass}>描述你想要的应用</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={textareaClass}
            rows={5}
            placeholder="例如:一个习惯打卡应用,每天可以勾选今天完成的习惯,展示连续打卡天数和本月日历热力图。"
          />
          {hint ? <p className="m-0 text-xs text-amber-600 dark:text-amber-400">{hint}</p> : null}
          <div className="flex items-center justify-between gap-2">
            <button className={ghostButtonClass} onClick={() => setRoute("chat")}>
              返回
            </button>
            <button className={primaryButtonClass} disabled={!desc.trim()} onClick={submit}>
              开始创建
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-slate-400 dark:text-neutral-500">
          提示:现有应用(记事本 / 待办 / 记账本)就是按这套结构手写的样板——
          每个应用 = 一个独立后端(<code>server/apps/&lt;id&gt;</code>)+ 一个独立库 + 一个 React 前端(<code>ui/src/apps/&lt;id&gt;</code>)+ 一份 <code>APP.md</code>。
        </p>
      </div>
    </div>
  );
}
