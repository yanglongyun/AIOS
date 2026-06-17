// 截当前可见 tab · 通过 chrome.tabs.captureVisibleTab · 返 dataUrl

import { getActiveTab, pickTab } from '../lib/active-tab.js';

export async function screenshot(args) {
  let tabId;
  let windowId;
  if (typeof args?.tabId === 'number') {
    tabId = args.tabId;
    const all = await chrome.tabs.query({});
    windowId = pickTab(all, tabId).windowId;
  } else {
    const tab = await getActiveTab();
    tabId = tab.id;
    windowId = tab.windowId;
  }
  // 先无损抓取,再统一压缩(长边降到 1568 + JPEG q80),省带宽
  const raw = await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
  const dataUrl = await compress(raw);
  return { tabId, format: 'jpeg', bytes: dataUrl.length, dataUrl };
}

const MAX_SIDE = 1568;
const JPEG_Q = 0.8;

/** 长边降到 MAX_SIDE 并转 JPEG;失败则回退原图 */
async function compress(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const bmp = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = new OffscreenCanvas(w, h);
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const out = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_Q });
    return `data:image/jpeg;base64,${b64(await out.arrayBuffer())}`;
  } catch {
    return dataUrl;
  }
}

function b64(buf) {
  let s = '';
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
