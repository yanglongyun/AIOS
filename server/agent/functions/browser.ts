// browser:操作 AIOS 管的那个 Chrome(服务端 CDP,见 server/browser/)。
// 登录态存在 ~/.aios/browser,跨重启保留;机器有图形桌面时是有头浏览器,用户在远程桌面里看得见。
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveLocalPath } from "../paths.js";
import { evaluate, listTabs, openTab, pageOf, send, waitLoad, type TabInfo } from "../../browser/cdp.js";
import { observe } from "../../browser/snapshot.js";
import { act } from "../../browser/act.js";

export const browserDef = {
  type: "function",
  name: "browser",
  description:
    "操作这台机器上的浏览器(Chrome,登录态会保留)。" +
    "【定位】先 snapshot 拿页面清单:一行一个可交互元素,形如 [n3-12] button \"登录\"。" +
    "之后的操作用 ref 指定目标,并带上 page_version;页面变了 ref 会失效,重新 snapshot。" +
    "【动作】tabs 列出标签;open 新标签打开网址;navigate/back 跳转后退;close 关标签;" +
    "snapshot 读页面结构;read 读正文文本;click/double_click/hover 点击悬停;" +
    "fill 填输入框(必须给 value,清空写空串);select 选下拉项;press 按键(Enter/Tab/Escape/方向键等);" +
    "scroll 滚动(delta_y);js 执行 JavaScript 并返回结果;screenshot 截图并交给你查看。" +
    "tab 不填就是最近操作的那个标签。",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string", description: "一句话说明这次操作的目的(界面会显示)" },
      action: {
        type: "string",
        enum: ["tabs", "open", "navigate", "back", "close", "snapshot", "read", "js",
          "click", "double_click", "hover", "fill", "select", "press", "scroll", "screenshot"],
        description: "要执行的动作",
      },
      tab: { type: "number", description: "目标标签编号(tabs 返回的 [n]);不填 = 最近操作的标签" },
      url: { type: "string", description: "open/navigate:网址" },
      ref: { type: "string", description: "目标元素的 ref(snapshot 里的 [n3-12])" },
      page_version: { type: "number", description: "snapshot 返回的 pageVersion,用来校验 ref 是否过期" },
      value: { type: "string", description: "fill:要填的文本;select:要选的项(值或可见文字)" },
      key: { type: "string", description: "press:Enter / Tab / Escape / Backspace / Delete / 方向键 / PageUp / PageDown / Home / End" },
      delta_y: { type: "number", description: "scroll:纵向滚动量,正数向下,默认 400" },
      x: { type: "number", description: "兜底:按视口坐标操作(结构化定位不到时,比如 canvas)" },
      y: { type: "number", description: "兜底:与 x 一起给" },
      max_nodes: { type: "number", description: "snapshot:最多返回多少行,默认 400" },
      code: { type: "string", description: "js:要执行的 JavaScript 表达式(可以 await)" },
      path: { type: "string", description: "screenshot 可选:保存路径;默认存到本轮产物目录" },
    },
    required: ["summary", "action"],
    additionalProperties: false,
  },
};

// 标签编号:模型看的是短数字,背后是 CDP 的 targetId
const numbers = new Map<string, number>();
const targets = new Map<number, string>();
let seq = 0;
let lastTarget = "";
const numberOf = (targetId: string) => {
  if (!numbers.has(targetId)) { seq += 1; numbers.set(targetId, seq); targets.set(seq, targetId); }
  return numbers.get(targetId)!;
};
const fmt = (t: TabInfo) => `[${numberOf(t.id)}] ${t.title || "(无标题)"} — ${t.url}`;

const normalizeUrl = (raw: unknown) => {
  const target = String(raw || "").trim();
  if (!target) throw new Error("需要 url");
  const url = /^[a-z][a-z0-9+.-]*:/i.test(target) ? target : `https://${target}`;
  if (!/^(https?|file|about):/i.test(url)) throw new Error("只支持 http(s) 网址");
  return url;
};

/** 选目标标签:显式编号 > 最近操作的 > 第一个;一个都没有就新开空白页。 */
const pickTab = async (tab: unknown) => {
  const tabs = await listTabs();
  tabs.forEach((t) => numberOf(t.id));
  if (tab != null && tab !== "") {
    const id = targets.get(Number(tab));
    if (!id || !tabs.some((t) => t.id === id)) throw new Error(`没有标签 ${tab}(先 tabs 看看)`);
    return id;
  }
  if (lastTarget && tabs.some((t) => t.id === lastTarget)) return lastTarget;
  if (tabs[0]) return tabs[0].id;
  return openTab("about:blank");
};

export const browser = async (args: Record<string, any>, ctx: Record<string, any>) => {
  const action = String(args.action || "");
  try {
    if (action === "tabs") {
      const tabs = await listTabs();
      return tabs.length ? tabs.map(fmt).join("\n") : "(没有打开的标签;用 open 打开一个)";
    }
    if (action === "open") {
      const url = normalizeUrl(args.url);
      // 浏览器刚起时那个空白页直接拿来用,别留一个空标签
      const blank = (await listTabs()).find((t) => t.url === "about:blank");
      let targetId: string;
      if (blank) {
        targetId = blank.id;
        const state = await pageOf(targetId);
        await send("Page.navigate", { url }, state.sessionId);
        await waitLoad(state);
      } else targetId = await openTab(url);
      lastTarget = targetId;
      const tab = (await listTabs()).find((t) => t.id === targetId);
      return `已打开 ${tab ? fmt(tab) : args.url}\n(接下来 snapshot 看页面结构,或 read 读正文)`;
    }

    const targetId = await pickTab(args.tab);
    lastTarget = targetId;
    const state = await pageOf(targetId);
    await send("Target.activateTarget", { targetId }).catch(() => {});

    switch (action) {
      case "navigate": {
        const url = normalizeUrl(args.url);
        await send("Page.navigate", { url }, state.sessionId);
        await waitLoad(state);
        return `标签 ${numberOf(targetId)} 已打开 ${url}`;
      }
      case "back": {
        await evaluate(state, "history.back()");
        await waitLoad(state, 10_000);
        return `标签 ${numberOf(targetId)} 已后退`;
      }
      case "close": {
        await send("Target.closeTarget", { targetId });
        if (lastTarget === targetId) lastTarget = "";
        return `已关闭标签 ${numberOf(targetId)}`;
      }
      case "read": {
        const r = await evaluate(state, "({ title: document.title, url: location.href, text: (document.body?.innerText || '').slice(0, 60000) })");
        return `title: ${r?.title || ""}\nurl: ${r?.url || ""}\n\n${r?.text || "(页面没有可读文本)"}`;
      }
      case "js": {
        if (!String(args.code || "").trim()) return "error: js 需要 code";
        const value = await evaluate(state, String(args.code));
        return value === undefined ? "undefined" : typeof value === "string" ? value : JSON.stringify(value, null, 2);
      }
      case "snapshot": {
        const snap = await observe(state, { maxNodes: Number(args.max_nodes) || 400 });
        const head = `[${numberOf(targetId)}] ${snap.title}\n${snap.url}\npageVersion=${snap.pageVersion}`;
        const body = snap.lines.join("\n") || "(这一页没有可交互元素)";
        return `${head}\n\n${body}${snap.truncated ? "\n\n(元素太多已截断,必要时提高 max_nodes)" : ""}`;
      }
      case "click": case "double_click": case "hover": case "fill": case "select": case "press": case "scroll": {
        const r = await act(state, {
          action, ref: args.ref, pageVersion: args.page_version, value: args.value, key: args.key,
          x: args.x, y: args.y, deltaY: args.delta_y,
        });
        return r.navigated ? `ok(地址变成 ${r.url},快照已作废,重新 snapshot)` : "ok";
      }
      case "screenshot": {
        const { data } = await send("Page.captureScreenshot", { format: "png" }, state.sessionId);
        const bytes = Buffer.from(String(data || ""), "base64");
        if (!bytes.length) return "error: 截图失败";
        const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
        const abs = args.path ? resolveLocalPath(String(args.path), ctx.cwd)
          : resolveLocalPath(join(ctx.outputDir || ctx.cwd || "~", `web-${stamp}.png`));
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, bytes);
        ctx.emit?.({ type: "tree_changed", reason: "browser_screenshot", paths: [abs] });
        return {
          output: `已截图保存到 ${abs}(${Math.round(bytes.length / 1024)} KB),并已作为图像交给你查看。`,
          image: { path: abs, mimeType: "image/png", size: bytes.length },
        };
      }
      default:
        return `error: 未知 action: ${action}`;
    }
  } catch (error: any) {
    return `error: ${error?.message || error}`;
  }
};
