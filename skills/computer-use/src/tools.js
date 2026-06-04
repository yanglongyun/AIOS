import { platform } from 'node:os';
import { detectDrivers } from './drivers.js';
import * as linux from './platforms/linux.js';
import * as mac from './platforms/mac.js';
import { screenshot } from './screenshot.js';
import { shell } from './shell.js';
import { toolSchemas } from './schemas.js';
import * as windows from './platforms/windows.js';

export async function callTool(tool, args = {}) {
  if (!toolSchemas[tool]) throw new Error(`unknown_tool: ${tool}`);

  if (tool === 'computer_status') {
    return { service: 'computer-use', tools: Object.keys(toolSchemas), drivers: await detectDrivers() };
  }
  if (tool === 'computer_shell') return shell(args);
  if (tool === 'computer_screenshot') return screenshot(args);

  const os = platform();
  if (os === 'darwin') return callDriver(mac, tool, args);
  if (os === 'linux') {
    await linux.requireXdotool();
    return callDriver(linux, tool, args);
  }
  if (os === 'win32') return callDriver(windows, tool, args);
  throw new Error(`unsupported_platform: ${os}`);
}

function callDriver(driver, tool, args) {
  if (tool === 'computer_mouse_move') return driver.mouseMove(args);
  if (tool === 'computer_click') return driver.click(args);
  if (tool === 'computer_double_click') return driver.click({ ...args, button: 'left', clicks: 2 });
  if (tool === 'computer_right_click') return driver.click({ ...args, button: 'right', clicks: 1 });
  if (tool === 'computer_scroll') return driver.scroll(args);
  if (tool === 'computer_type') return driver.typeText(args);
  if (tool === 'computer_key') return driver.pressKey(args);
  if (tool === 'computer_hotkey') return driver.hotkey(args);
  throw new Error(`unknown_tool: ${tool}`);
}
