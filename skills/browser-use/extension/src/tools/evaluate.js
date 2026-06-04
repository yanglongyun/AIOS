// 在指定 tab 里 eval 一段 expression · LLM 输出什么就求什么

import { getActiveTab } from '../lib/active-tab.js';
import { sendDebuggerCommand } from '../lib/cdp.js';

export async function evaluate(args) {
  const code = String(args?.script || args?.code || '').trim();
  if (!code) throw new Error('code_required');
  let tabId = Number(args?.tabId);
  if (!Number.isFinite(tabId)) {
    const tab = await getActiveTab();
    if (!tab.id) throw new Error('no_active_tab');
    tabId = tab.id;
  }
  const res = await sendDebuggerCommand(tabId, 'Runtime.evaluate', {
    expression: code,
    awaitPromise: true,
    returnByValue: true,
  });
  if (res?.exceptionDetails) {
    const desc =
      res.exceptionDetails.exception?.description ??
      res.exceptionDetails.text ??
      'evaluate error';
    throw new Error(desc);
  }
  return { tabId, value: res?.result?.value };
}
