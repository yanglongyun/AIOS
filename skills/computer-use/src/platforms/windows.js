import { amountArg, normalizeKey, numberArg, run } from '../utils.js';

export async function mouseMove(args) {
  const x = numberArg(args.x, 'x');
  const y = numberArg(args.y, 'y');
  if (args.dryRun) return { dryRun: true, x, y };
  await runScript(`
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);' -Name User32 -Namespace Native
[Native.User32]::SetCursorPos(${x}, ${y}) | Out-Null
`);
  return { x, y, driver: 'powershell' };
}

export async function click(args) {
  const x = args.x === undefined ? null : numberArg(args.x, 'x');
  const y = args.y === undefined ? null : numberArg(args.y, 'y');
  const button = String(args.button || 'left').toLowerCase();
  const clicks = amountArg(args.clicks, 1);
  if (args.dryRun) return { dryRun: true, x, y, button, clicks };
  const downUp = { left: [0x0002, 0x0004], right: [0x0008, 0x0010], middle: [0x0020, 0x0040] }[button];
  if (!downUp) throw new Error(`invalid_mouse_button: ${button}`);
  if (x !== null && y !== null) await mouseMove({ x, y });
  await runScript(`
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int data, int extra);' -Name User32 -Namespace Native
for ($i = 0; $i -lt ${clicks}; $i++) {
  [Native.User32]::mouse_event(${downUp[0]}, 0, 0, 0, 0)
  [Native.User32]::mouse_event(${downUp[1]}, 0, 0, 0, 0)
}
`);
  return { x, y, button, clicks, driver: 'powershell' };
}

export async function scroll(args) {
  const direction = String(args.direction || 'down').toLowerCase();
  const amount = amountArg(args.amount, 1);
  if (args.dryRun) return { dryRun: true, direction, amount };
  const clicks = direction === 'up' || direction === 'left' ? 120 * amount : -120 * amount;
  await runScript(`
Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int data, int extra);' -Name User32 -Namespace Native
[Native.User32]::mouse_event(0x0800, 0, 0, ${clicks}, 0)
`);
  return { direction, amount, driver: 'powershell' };
}

export async function typeText(args) {
  const text = String(args.text ?? '');
  if (args.dryRun) return { dryRun: true, text };
  await runScript(`
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait(${JSON.stringify(text)})
`);
  return { text, driver: 'powershell' };
}

export async function pressKey(args) {
  const key = normalizeKey(args.key);
  const modifiers = Array.isArray(args.modifiers) ? args.modifiers.map(normalizeKey) : [];
  if (args.dryRun) return { dryRun: true, key, modifiers };
  const prefix = modifiers.map((modifier) => modifierMap[modifier] || '').join('');
  const sendKey = key.length === 1 ? key : `{${key.toUpperCase()}}`;
  await runScript(`
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait(${JSON.stringify(`${prefix}${sendKey}`)})
`);
  return { key, modifiers, driver: 'powershell' };
}

export async function hotkey(args) {
  const keys = Array.isArray(args.keys) ? args.keys.map(normalizeKey).filter(Boolean) : [];
  if (keys.length < 2) throw new Error('hotkey_requires_at_least_two_keys');
  return pressKey({ key: keys.at(-1), modifiers: keys.slice(0, -1), dryRun: args.dryRun });
}

async function runScript(script) {
  await run('powershell.exe', ['-NoProfile', '-Command', script]);
}

const modifierMap = {
  control: '^',
  ctrl: '^',
  alt: '%',
  option: '%',
  shift: '+',
  command: '^',
  meta: '^',
};
