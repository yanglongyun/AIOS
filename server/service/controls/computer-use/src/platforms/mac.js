import { amountArg, commandExists, normalizeKey, numberArg, run } from '../utils.js';

const keyCodes = {
  enter: 36,
  return: 36,
  tab: 48,
  space: 49,
  delete: 51,
  backspace: 51,
  escape: 53,
  esc: 53,
  command: 55,
  shift: 56,
  option: 58,
  alt: 58,
  control: 59,
  ctrl: 59,
  home: 115,
  page_up: 116,
  end: 119,
  page_down: 121,
  left: 123,
  arrow_left: 123,
  right: 124,
  arrow_right: 124,
  down: 125,
  arrow_down: 125,
  up: 126,
  arrow_up: 126,
  f1: 122,
  f2: 120,
  f3: 99,
  f4: 118,
  f5: 96,
  f6: 97,
  f7: 98,
  f8: 100,
  f9: 101,
  f10: 109,
  f11: 103,
  f12: 111,
};

const modifierNames = {
  command: 'command down',
  cmd: 'command down',
  meta: 'command down',
  control: 'control down',
  ctrl: 'control down',
  option: 'option down',
  alt: 'option down',
  shift: 'shift down',
};

export async function mouseMove(args) {
  const x = numberArg(args.x, 'x');
  const y = numberArg(args.y, 'y');
  if (args.dryRun) return { dryRun: true, x, y };
  if (!(await commandExists('cliclick'))) throw new Error('missing_cliclick_for_mouse_move: brew install cliclick');
  await run('cliclick', [`m:${x},${y}`]);
  return { x, y, driver: 'cliclick' };
}

export async function click(args) {
  const x = args.x === undefined ? null : numberArg(args.x, 'x');
  const y = args.y === undefined ? null : numberArg(args.y, 'y');
  const button = String(args.button || 'left').toLowerCase();
  const clicks = amountArg(args.clicks, 1);
  if (args.dryRun) return { dryRun: true, x, y, button, clicks };

  if (await commandExists('cliclick')) {
    const prefix = button === 'right' ? 'rc' : clicks > 1 ? 'dc' : 'c';
    if (button === 'middle') throw new Error('unsupported_cliclick_middle_click');
    const target = x === null || y === null ? prefix : `${prefix}:${x},${y}`;
    for (let i = 0; i < (prefix === 'c' ? clicks : 1); i += 1) await run('cliclick', [target]);
    return { x, y, button, clicks, driver: 'cliclick' };
  }

  if (button !== 'left') throw new Error('missing_cliclick_for_non_left_click: brew install cliclick');
  if (x === null || y === null) throw new Error('coordinates_required_without_cliclick');
  const script = `tell application "System Events" to click at {${x}, ${y}}`;
  for (let i = 0; i < clicks; i += 1) await run('osascript', ['-e', script]);
  return { x, y, button, clicks, driver: 'osascript' };
}

export async function scroll(args) {
  const direction = String(args.direction || 'down').toLowerCase();
  const amount = amountArg(args.amount, 1);
  if (args.dryRun) return { dryRun: true, direction, amount };
  if (!(await commandExists('cliclick'))) throw new Error('missing_cliclick_for_scroll: brew install cliclick');
  const code = { up: 'wu', down: 'wd', left: 'wl', right: 'wr' }[direction];
  if (!code) throw new Error(`invalid_scroll_direction: ${direction}`);
  await run('cliclick', [`${code}:${amount}`]);
  return { direction, amount, driver: 'cliclick' };
}

export async function typeText(args) {
  const text = String(args.text ?? '');
  if (args.dryRun) return { dryRun: true, text };
  await run('osascript', ['-e', `tell application "System Events" to keystroke "${appleScriptString(text)}"`]);
  return { text, driver: 'osascript' };
}

export async function pressKey(args) {
  const key = normalizeKey(args.key);
  const modifiers = Array.isArray(args.modifiers) ? args.modifiers : [];
  if (args.dryRun) return { dryRun: true, key, modifiers };
  const using = appleModifiers(modifiers);
  if (keyCodes[key] !== undefined) {
    await run('osascript', ['-e', `tell application "System Events" to key code ${keyCodes[key]}${using}`]);
  } else if (key.length === 1) {
    await run('osascript', ['-e', `tell application "System Events" to keystroke "${appleScriptString(key)}"${using}`]);
  } else {
    throw new Error(`unsupported_key: ${key}`);
  }
  return { key, modifiers, driver: 'osascript' };
}

export async function hotkey(args) {
  const keys = Array.isArray(args.keys) ? args.keys.map(normalizeKey).filter(Boolean) : [];
  if (keys.length < 2) throw new Error('hotkey_requires_at_least_two_keys');
  return pressKey({ key: keys.at(-1), modifiers: keys.slice(0, -1), dryRun: args.dryRun });
}

function appleScriptString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function appleModifiers(modifiers = []) {
  const mapped = modifiers.map((item) => modifierNames[String(item).toLowerCase()]).filter(Boolean);
  return mapped.length ? ` using {${mapped.join(', ')}}` : '';
}
