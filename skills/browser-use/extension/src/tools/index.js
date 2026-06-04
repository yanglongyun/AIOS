// runTool 分发 · 所有 browser_* 工具汇总在这

import * as tabs from './tabs.js';
import { evaluate } from './evaluate.js';
import { screenshot } from './screenshot.js';

const handlers = {
  browser_status:       tabs.status,
  browser_open_tab:     tabs.openTab,
  browser_tabs:         tabs.list,
  browser_activate_tab: tabs.activate,
  browser_close_tab:    tabs.close,
  browser_navigate:     tabs.navigate,
  browser_evaluate:     evaluate,
  browser_screenshot:   screenshot,
};

export async function runTool(name, args) {
  const fn = handlers[name];
  if (!fn) throw new Error(`unknown_tool: ${name}`);
  return fn(args || {});
}
