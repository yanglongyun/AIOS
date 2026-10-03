// 这几样浏览器 API 只在「安全上下文」(HTTPS 或 localhost)里才有。
// AIOS 常常是 http://<IP> 直接访问,得自带兜底,否则一调用就整页白屏。

/** crypto.randomUUID 的兜底:非安全上下文里用 getRandomValues(任何上下文都有)拼一个 v4 UUID。 */
export const uuid = (): string => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

/** 复制文本:有 Clipboard API 用它,没有(http 访问)退回 execCommand。 */
export const copyText = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  } catch { /* 权限被拒等,走下面的老办法 */ }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
};
