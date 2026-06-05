import { useState } from "react";
import { ArrowRight, Boxes, Cpu, Sparkles } from "lucide-react";
import type { RouteName } from "../components/AppShell";
import { api } from "../api";
import { useConversation } from "../state/conversation";
import { useSocket } from "../state/socket";

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
    title: "3 · 自动注册热加载",
    desc: "写入 server/apps 与 ui/src/apps 并登记进注册表,侧边栏「应用」里立即出现,无需重启。",
  },
];

export function CreateAppView({ setRoute }: { setRoute: (route: RouteName) => void }) {
  const conversation = useConversation();
  const socket = useSocket();
  const [desc, setDesc] = useState("");
  const [hint, setHint] = useState("");

  const submit = async () => {
    const text = desc.trim();
    if (!text) return;
    const buildPrompt =
      `请按 create-app 指南在本系统(AIOS)创建一个应用。\n\n` +
      `需求:${text}\n\n` +
      `步骤:先读 skills/create-app/SKILL.md,然后用 shell 按规范写「后端 + 前端 + APP.md」并注册到 ` +
      `server/apps/registry.ts 与 ui/src/apps/registry.ts(如需新图标改 MainNav 的 appIconMap)。` +
      `写完跑 npm run ui:build 自检,最后给我文件清单,并提醒我重启服务后即可在侧边栏使用。`;
    try {
      setHint("");
      const result = await api.createConversation(`创建应用:${text.slice(0, 16)}`);
      const conversationId = result.conversation?.id;
      if (!conversationId) throw new Error("创建会话失败");
      conversation.setCurrentConversation(conversationId, result.conversation);
      socket.send({ type: "chat.subscribe", conversationId });
      socket.send({ type: "chat.send", conversationId, prompt: buildPrompt });
      setRoute("chat");
    } catch (error) {
      setHint(error instanceof Error ? error.message : "启动失败");
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-10 flex flex-col gap-7">
        <header className="flex flex-col gap-2">
          <div
            className="w-12 h-12 rounded-2xl grid place-items-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #FFD21E 0%, #f59e0b 100%)" }}
          >
            <Sparkles size={22} />
          </div>
          <h2 className="m-0 text-2xl font-semibold text-text leading-tight">创建应用</h2>
          <p className="m-0 text-sm text-text-mute leading-relaxed">
            在 AIOS 里,应用不是装出来的,是<strong className="text-text">长出来的</strong>。
            你描述需求,AI 现场把它写进你的系统——前端、后端、数据库一应俱全。
          </p>
        </header>

        <div className="grid gap-3">
          {STEPS.map((step) => (
            <div key={step.title} className="flex items-start gap-3 p-4 rounded-2xl border border-border-soft bg-bg-raised">
              <div className="w-9 h-9 rounded-xl grid place-items-center bg-bg-hover text-accent shrink-0">
                <step.icon size={18} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-text">{step.title}</span>
                <span className="text-xs text-text-mute leading-relaxed">{step.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 p-5 rounded-2xl border border-border-soft bg-bg-raised">
          <label className="field-label">描述你想要的应用</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="textarea"
            rows={5}
            placeholder="例如:一个习惯打卡应用,每天可以勾选今天完成的习惯,展示连续打卡天数和本月日历热力图。"
          />
          {hint ? <p className="text-xs text-accent">{hint}</p> : null}
          <div className="flex items-center justify-between gap-2">
            <button className="btn btn-sm btn-ghost" onClick={() => setRoute("chat")}>
              返回
            </button>
            <button className="btn btn-sm btn-primary" disabled={!desc.trim()} onClick={submit}>
              开始创建
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <p className="text-xxs text-text-faint leading-relaxed">
          提示:现有应用(记事本 / 待办 / 记账本)就是按这套结构手写的样板——
          每个应用 = 一个独立后端(<code>server/apps/&lt;id&gt;</code>)+ 一个独立库 + 一个 React 前端(<code>ui/src/apps/&lt;id&gt;</code>)+ 一份 <code>APP.md</code>。
        </p>
      </div>
    </div>
  );
}
