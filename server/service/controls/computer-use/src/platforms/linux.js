import { amountArg, commandExists, normalizeKey, numberArg, run } from '../utils.js';

export async function requireXdotool() {
  if (!(await commandExists('xdotool'))) throw new Error('missing_xdotool: install xdotool');
}

export async function mouseMove(args) {
  const x = numberArg(args.x, 'x');
  const y = numberArg(args.y, 'y');
  if (args.dryRun) return { dryRun: true, x, y };
  await run('xdotool', ['mousemove', String(x), String(y)]);
  return { x, y, driver: 'xdotool' };
}

export async function click(args) {
  const button = String(args.button || 'left').toLowerCase();
  const clicks = amountArg(args.clicks, 1);
  const map = { left: '1', middle: '2', right: '3' };
  if (!map[button]) throw new Error(`invalid_mouse_button: ${button}`);
  if (args.dryRun) return { dryRun: true, button, clicks, x: args.x, y: args.y };
  if (args.x !== undefined && args.y !== undefined) await mouseMove(args);
  for (let i = 0; i < clicks; i += 1) await run('xdotool', ['click', map[button]]);
  return { button, clicks, x: args.x, y: args.y, driver: 'xdotool' };
}

export async function scroll(args) {
  const direction = String(args.direction || 'down').toLowerCase();
  const amount = amountArg(args.amount, 1);
  const map = { up: '4', down: '5', left: '6', right: '7' };
  if (!map[direction]) throw new Error(`invalid_scroll_direction: ${direction}`);
  if (args.dryRun) return { dryRun: true, direction, amount };
  for (let i = 0; i < amount; i += 1) await run('xdotool', ['click', map[direction]]);
  return { direction, amount, driver: 'xdotool' };
}

export async function typeText(args) {
  const text = String(args.text ?? '');
  if (args.dryRun) return { dryRun: true, text };
  await run('xdotool', ['type', '--clearmodifiers', text]);
  return { text, driver: 'xdotool' };
}

export async function pressKey(args) {
  const key = normalizeKey(args.key);
  const modifiers = Array.isArray(args.modifiers) ? args.modifiers.map(normalizeKey) : [];
  if (args.dryRun) return { dryRun: true, key, modifiers };
  await run('xdotool', ['key', '--clearmodifiers', [...modifiers, key].join('+')]);
  return { key, modifiers, driver: 'xdotool' };
}

export async function hotkey(args) {
  const keys = Array.isArray(args.keys) ? args.keys.map(normalizeKey).filter(Boolean) : [];
  if (keys.length < 2) throw new Error('hotkey_requires_at_least_two_keys');
  return pressKey({ key: keys.at(-1), modifiers: keys.slice(0, -1), dryRun: args.dryRun });
}
