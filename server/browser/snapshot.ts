// 页面快照:把一页东西压成模型读得懂、又不烧 token 的一张清单(无障碍树,裁到能交互/有信息的):
//
//     [n37-12] button "登录"
//     [n37-18] textbox "邮箱"
//
// ref 里带页面版本(n37):页面一变版本就跳,拿旧 ref 来点会被挡下并要求重读。
// 版本只在导航或显式重读时才变 —— 每次 DOM 抖动都作废会把模型逼进「过期→重读」的循环。
import { send, sessionsOf, pageUrl, type PageState } from "./cdp.js";

const ACTIONABLE = new Set([
  "button", "link", "textbox", "searchbox", "combobox", "listbox", "option",
  "checkbox", "radio", "switch", "slider", "spinbutton", "menuitem",
  "menuitemcheckbox", "menuitemradio", "tab", "treeitem",
]);
const INFORMATIVE = new Set(["heading", "alert", "status", "dialog", "article", "img"]);

const textOf = (node: any, key: string) => {
  const value = node?.[key]?.value;
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
};
const propOn = (node: any, name: string) => node.properties?.find((p: any) => p.name === name)?.value?.value;

const lineFor = (node: any, ref: string) => {
  const role = textOf(node, "role");
  const name = textOf(node, "name");
  const value = textOf(node, "value");
  const bits = [`[${ref}]`, role];
  if (name) bits.push(JSON.stringify(name.slice(0, 120)));
  if (value && value !== name) bits.push(`= ${JSON.stringify(value.slice(0, 80))}`);
  const flags: string[] = [];
  if (propOn(node, "disabled")) flags.push("disabled");
  if (propOn(node, "checked")) flags.push("checked");
  if (propOn(node, "expanded") === false) flags.push("collapsed");
  if (propOn(node, "focused")) flags.push("focused");
  if (flags.length) bits.push(`(${flags.join(",")})`);
  return bits.join(" ");
};

export const observe = async (state: PageState, { maxNodes = 400 } = {}) => {
  const version = (state.snapshotSeq += 1);
  const refs = new Map<string, { backendNodeId: number; sessionId: string }>();
  const lines: string[] = [];

  for (const session of sessionsOf(state)) {
    let tree: any;
    try {
      await send("Accessibility.enable", {}, session.sessionId);
      tree = await send("Accessibility.getFullAXTree", {}, session.sessionId);
    } catch { continue; } // 某个 iframe 拿不到就跳过,别让整页快照失败
    if (session.sessionId !== state.sessionId) lines.push(`--- iframe ${session.url} ---`);

    for (const node of tree.nodes || []) {
      if (lines.length >= maxNodes) break;
      if (node.ignored || !node.backendDOMNodeId) continue;
      const role = textOf(node, "role");
      const name = textOf(node, "name");
      const actionable = ACTIONABLE.has(role);
      if (!actionable && !(INFORMATIVE.has(role) && name)) continue;
      if (actionable && !name && !textOf(node, "value") && role !== "textbox") continue;
      const ref = `n${version}-${refs.size + 1}`;
      refs.set(ref, { backendNodeId: node.backendDOMNodeId, sessionId: session.sessionId });
      lines.push(lineFor(node, ref));
    }
  }

  state.snapshot = { version, refs };
  const { result } = await send("Runtime.evaluate", { expression: "document.title", returnByValue: true }, state.sessionId).catch(() => ({ result: {} as any }));
  return { pageVersion: version, url: await pageUrl(state), title: String(result?.value || ""), lines, truncated: lines.length >= maxNodes };
};

export const resolveRef = (state: PageState, ref: string, pageVersion?: number) => {
  const snapshot = state.snapshot;
  if (!snapshot) throw new Error("还没有快照(或页面已经跳转)—— 先用 action=snapshot 读一次页面");
  if (pageVersion != null && Number(pageVersion) !== snapshot.version) {
    throw new Error(`快照过期(你拿的是 ${pageVersion},现在是 ${snapshot.version})—— 重新 snapshot 一次再操作`);
  }
  const node = snapshot.refs.get(String(ref));
  if (!node) throw new Error(`快照里没有 ${ref} —— 重新 snapshot 一次看看它还在不在`);
  return node;
};
