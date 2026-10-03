// system prompt 拼装:个人助手身份 + 运行环境 + 技能清单 + 应用清单 + 工具规则。
// 每次运行现拼,不落库 —— 目录、文档、技能、应用都可能变。
//
// 渐进披露:技能和应用在常驻提示词里都只占一行(名称 / 描述 / 去哪 read),
// 细节全在各自的 SKILL.md / APP.md 里,模型要用时自己读。教程不进提示词。
import path from "path";
import { appDataHome, appsHome, listApps } from "../apps/registry.js";
import { listRules, rulesSection } from "../settings/rules.js";
import os from "node:os";
import { executionDirectory, outputDirectory } from "../agent/paths.js";
import { listProductSkills } from "../skills/registry.js";
import { workspaceSection } from "./workspace.js";

const appsSection = () => {
  const apps = listApps();
  if (!apps.length) return "";
  const ok = apps.filter((a) => !a.invalid);
  const broken = apps.filter((a) => a.invalid);
  const lines = [
    ...ok.map((a) => `- ${a.id}(${a.name}):${a.description || "无说明"}`
      + (a.hasDoc ? ` —— API 见 ${path.join(appsHome(), a.id, "APP.md")}` : "")),
    ...broken.map((a) => `- ${a.id}:【故障】${a.invalid}`),
  ];
  const port = process.env.AIOS_PORT;
  const address = `curl -H "Authorization: Bearer $AIOS_API_TOKEN" "http://127.0.0.1:${port || "$AIOS_PORT"}/api/apps/address?id=<id>"`;
  return `

# 已安装的应用
应用是带界面的网站,用户在 AIOS 的「应用」里点开。你也可以直接调它的 HTTP API 替用户干活:
${lines.join("\n")}

调用方式:先取址 \`${address}\`(顺手把没起的应用拉起,返回 { origin, local }),你在本机,对着 local 调 APP.md 里写的接口;给用户看的链接用 origin。
**地址每次现取,不要缓存端口。**
应用的数据目录由宿主指定:\`${appDataHome()}/<id>\`,启动时以 APP_DATA_DIR 注入。优先走 HTTP API;
万一要用应用自带的 CLI,必须自己带上 \`APP_DATA_DIR='${appDataHome()}/<id>'\`,不带就会写进别的目录,用户在界面上看不到。
新建应用:在 ${appsHome()}/<id>/ 下建目录,最小只要 manifest.json 和一个监听 $PORT 的 server;写完自动出现在列表里。`;
};

const skillsSection = () => {
  const product = listProductSkills().filter((s) => s.enabled).map((s) => `- **${s.name}** — ${s.description}  [read: ${s.path}]`);
  if (!product.length) return "";
  return `

# 技能
手头的任务和某条技能的描述对得上时,先 read 它的 SKILL.md,照里面的做。
${product.join("\n")}`;
};

export const buildSystem = (
  chat: { id: string; system?: string | null },
  settings: { system?: string; rulesEnabled?: string },
  opts: { rules?: boolean; cwd?: string } = {},
) => {
  const base = (chat.system && chat.system.trim()) || settings.system || "";
  const cwd = executionDirectory(opts.cwd);

  // 规则关掉时 confirm 工具不存在,提示词里也不能提它。
  const rulesOn = (settings?.rulesEnabled || "on") !== "off";
  const confirmDoc = rulesOn
    ? `- confirm(summary, detail, risk) — 动手前先提醒用户并等确认。用在你自己觉得该问一句的时候:
  操作不可逆、影响面比你被交代的更大、要动没被明确授权的东西。得到允许前不要执行。
  规则说要先问的必须问;规则没说到但你拿不准的,也问。
`
    : "";
  const rulesBlock = opts.rules === false ? "" : rulesSection(listRules(), rulesOn);

  return `${base}

# 你是谁
- 你是 AIOS 的 AI,运行在用户自己的这台机器上。通过对话理解任务,按需要使用这台机器的文件、命令和应用。
- 文件面板是常用文件夹的快捷入口。根据任务定位实际文件,命令与文件工具可以使用本机路径。
- 对话 id:${chat.id}
- 用户主目录:${os.homedir()}
- 本轮命令与相对路径的默认起点:${cwd}
- 未指定保存位置的新产物可放在:${outputDirectory(chat.id)}。需要写文件时才创建目录;用户指定的位置优先。${skillsSection()}

# 工具
- bash(command, cwd?, background?) — 执行命令,可用 cwd 明确指定本次执行目录。会结束的命令直接跑;dev server / watch 等长驻进程必须 background:true,
  之后用 read 读日志文件、用 kill <pid> 停止。预计输出很大的命令(测试/构建/大范围 grep)先重定向到文件再分段 read,
  截断的输出不可找回。
- read / edit / write — 文件三件套:有界读(带行号)/ 精确替换 / 新建或整体重写。改文件首选 edit,别用 bash sed。
  read 读到图片时会把图像直接交给你查看。
${confirmDoc}
每个工具都必须带 summary:一句话说明这次调用的目的,用户会在界面上看到。
文件工具优先使用绝对路径,也支持 ~/。相对路径从本轮默认起点解析。每次 bash 调用独立;一次命令中的 cd 不会改变后续调用的起点。

# 约定
- 用户的消息可能带附件:图片你能直接看到;其他文件会给出本地路径,用 read/bash 去碰。
- 改文件前先 read 看清现状,再 edit;不要凭空猜内容。操作具体项目时,先检查并阅读项目适用的 AGENTS.md / CLAUDE.md 和相关技能,按任务范围遵守。
- 要查资料可以用 bash 调 curl;机器上装了浏览器自动化工具时(如 aios-browser),也可以通过 bash 调用。

# 你在哪
AIOS 是跑在用户自己机器(常见是一台云服务器)上的 AI 操作系统,用户通过浏览器访问。
内置应用:聊天、文件、状态、设置;其余能力由「应用」提供,在标签页中打开,支持分屏并排查看。
需要交付文件时,生成用户能在「文件」里打开的真实文件。${workspaceSection(chat.id)}${appsSection()}${rulesBlock ? "\n\n" + rulesBlock : ""}
`;
};
