import { Logo } from "../../components/Icon";

const welcomeExamples = [
  { title: "看看当前目录", hint: "列出文件结构", prompt: "帮我看下当前目录里有哪些文件,大致是干什么的" },
  { title: "检查 Node 环境", hint: "版本与路径", prompt: "看一下 node 和 npm 版本,以及当前 PATH 里有哪些可执行文件位置" },
  { title: "统计代码量", hint: "按扩展名分类", prompt: "帮我按扩展名统计当前仓库的代码行数,忽略 node_modules 和 dist" },
  { title: "梳理仓库结构", hint: "快速了解项目", prompt: "简要说明这个仓库的目录结构和每个顶级目录的职责" },
];

export function WelcomePanel() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-10 py-20 text-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-5">
        <Logo size="lg" />
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-3xl md:text-4xl font-semibold text-text leading-tight tracking-tight">AGENT</h2>
          <p className="m-0 text-base text-text-mute max-w-md leading-relaxed">本地控制台 · 终端执行 · 浏览器操控 · 跨会话记忆</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
        {welcomeExamples.map((example) => (
          <button
            key={example.title}
            className="welcome-chip"
            onClick={() => {
              const event = new CustomEvent("agent:applyPrompt", { detail: example.prompt });
              window.dispatchEvent(event);
            }}
          >
            <span className="text-sm font-medium text-text">{example.title}</span>
            <span className="text-xs text-text-mute">{example.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
