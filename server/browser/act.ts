// 原子操作:点、填、选、按键、滚动、悬停。
// 走 CDP Input 域派发的是**真实输入**(isTrusted=true),和用户自己动手没有区别 ——
// 文件选择、拖放、各种框架的手势判定都认。
import { send, pageUrl, type PageState } from "./cdp.js";
import { resolveRef } from "./snapshot.js";

type Node = { backendNodeId: number; sessionId: string };

const callOnNode = async (node: Node, functionDeclaration: string, args: unknown[] = []) => {
  const { object } = await send("DOM.resolveNode", { backendNodeId: node.backendNodeId }, node.sessionId);
  if (!object?.objectId) throw new Error("拿不到这个元素的句柄");
  const result = await send("Runtime.callFunctionOn", {
    objectId: object.objectId, functionDeclaration, arguments: args.map((value) => ({ value })),
    returnByValue: true, awaitPromise: true,
  }, node.sessionId);
  if (result.exceptionDetails) throw new Error(String(result.exceptionDetails.exception?.description || "操作失败").slice(0, 500));
  return result.result?.value;
};

/** 节点在视口里的中心点,顺带滚进视野。 */
const centerOf = async (node: Node) => {
  await send("DOM.scrollIntoViewIfNeeded", { backendNodeId: node.backendNodeId }, node.sessionId).catch(() => {});
  const box = await send("DOM.getBoxModel", { backendNodeId: node.backendNodeId }, node.sessionId);
  const quad = box?.model?.border;
  if (!quad || quad.length < 8) throw new Error("这个元素没有可见的位置(可能被隐藏了)");
  const x = (quad[0] + quad[2] + quad[4] + quad[6]) / 4;
  const y = (quad[1] + quad[3] + quad[5] + quad[7]) / 4;
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("算不出这个元素的位置");
  return { x, y, sessionId: node.sessionId };
};

const mouse = (sessionId: string, type: string, x: number, y: number, button = "left", clickCount = 1) =>
  send("Input.dispatchMouseEvent", { type, x, y, button, clickCount, buttons: type === "mouseReleased" ? 0 : 1 }, sessionId);

const clickAt = async (sessionId: string, x: number, y: number, clickCount = 1) => {
  await mouse(sessionId, "mouseMoved", x, y, "none", 0);
  await mouse(sessionId, "mousePressed", x, y, "left", clickCount);
  await mouse(sessionId, "mouseReleased", x, y, "left", clickCount);
};

const KEYS: Record<string, { key: string; code: string; keyCode: number; text?: string }> = {
  Enter: { key: "Enter", code: "Enter", keyCode: 13, text: "\r" },
  Tab: { key: "Tab", code: "Tab", keyCode: 9, text: "\t" },
  Escape: { key: "Escape", code: "Escape", keyCode: 27 },
  Backspace: { key: "Backspace", code: "Backspace", keyCode: 8 },
  Delete: { key: "Delete", code: "Delete", keyCode: 46 },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  PageDown: { key: "PageDown", code: "PageDown", keyCode: 34 },
  PageUp: { key: "PageUp", code: "PageUp", keyCode: 33 },
  Home: { key: "Home", code: "Home", keyCode: 36 },
  End: { key: "End", code: "End", keyCode: 35 },
};

const pressKey = async (sessionId: string, name: string) => {
  const spec = KEYS[name];
  if (!spec) throw new Error(`不认识的键:${name}(支持:${Object.keys(KEYS).join(" / ")})`);
  await send("Input.dispatchKeyEvent", { type: "keyDown", ...spec }, sessionId);
  if (spec.text) await send("Input.dispatchKeyEvent", { type: "char", ...spec }, sessionId);
  await send("Input.dispatchKeyEvent", { type: "keyUp", ...spec }, sessionId);
};

export type ActInput = {
  action: string; ref?: string; pageVersion?: number; value?: string; key?: string;
  x?: number; y?: number; deltaY?: number;
};

export const act = async (state: PageState, input: ActInput) => {
  const action = input.action;
  const before = await pageUrl(state);
  const byPoint = input.ref == null && Number.isFinite(Number(input.x)) && Number.isFinite(Number(input.y));
  // press / scroll 可以不指定目标:按键发给当前焦点,滚动在视口中间滚
  const free = input.ref == null && !byPoint && (action === "press" || action === "scroll");
  if (input.ref == null && !byPoint && !free) throw new Error(`${action} 需要 ref(先 snapshot 拿),或者给 x/y 按坐标兜底`);
  const node = input.ref == null ? null : resolveRef(state, String(input.ref), input.pageVersion);
  const point = node ? await centerOf(node)
    : byPoint ? { x: Number(input.x), y: Number(input.y), sessionId: state.sessionId }
    : { x: 640, y: 400, sessionId: state.sessionId };

  switch (action) {
    case "click": await clickAt(point.sessionId, point.x, point.y); break;
    case "double_click": await clickAt(point.sessionId, point.x, point.y, 2); break;
    case "hover": await mouse(point.sessionId, "mouseMoved", point.x, point.y, "none", 0); break;
    case "fill": {
      // 少给 value 必须报错:当成空串会清空输入框却报成功
      if (input.value == null) throw new Error('fill 要 value(要填什么)。清空请显式写 value: ""');
      await clickAt(point.sessionId, point.x, point.y);
      if (node) await send("DOM.focus", { backendNodeId: node.backendNodeId }, node.sessionId).catch(() => {});
      // 全选再覆盖:Linux/Windows 是 Ctrl+A(modifiers 2),macOS 是 Cmd+A(4),两个都发
      for (const modifiers of [2, 4]) {
        for (const type of ["keyDown", "keyUp"]) {
          await send("Input.dispatchKeyEvent", { type, key: "a", code: "KeyA", keyCode: 65, modifiers }, point.sessionId);
        }
      }
      await send("Input.insertText", { text: String(input.value) }, point.sessionId);
      break;
    }
    case "select": {
      if (!node) throw new Error("select 需要 ref(要知道是哪个下拉框)");
      const picked = await callOnNode(node, `function (wanted) {
        if (this.tagName !== 'SELECT') {
          this.value = wanted;
          this.dispatchEvent(new Event('input', { bubbles: true }));
          this.dispatchEvent(new Event('change', { bubbles: true }));
          return wanted;
        }
        const options = [...this.options];
        const hit = options.find((o) => o.value === wanted)
          || options.find((o) => (o.label || o.text || '').trim() === wanted)
          || options.find((o) => (o.label || o.text || '').includes(wanted));
        if (!hit) return null;
        this.value = hit.value;
        this.dispatchEvent(new Event('input', { bubbles: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));
        return hit.label || hit.text || hit.value;
      }`, [String(input.value ?? "")]);
      if (picked == null) throw new Error(`下拉框里没有「${input.value}」这一项`);
      break;
    }
    case "press": await pressKey(point.sessionId, String(input.key || "Enter")); break;
    case "scroll":
      await send("Input.dispatchMouseEvent", {
        type: "mouseWheel", x: point.x, y: point.y, deltaX: 0, deltaY: Number(input.deltaY) || 400,
      }, point.sessionId);
      break;
    default:
      throw new Error(`不认识的动作:${action}`);
  }

  await new Promise((r) => setTimeout(r, 300)); // 给页面一点反应时间
  const after = await pageUrl(state);
  return { navigated: after !== before, url: after };
};
