import { platform } from 'node:os';
import { commandExists } from './utils.js';

export async function detectDrivers() {
  const os = platform();
  if (os === 'darwin') {
    return {
      platform: os,
      screencapture: await commandExists('screencapture'),
      osascript: await commandExists('osascript'),
      cliclick: await commandExists('cliclick'),
    };
  }
  if (os === 'linux') {
    return {
      platform: os,
      xdotool: await commandExists('xdotool'),
      gnomeScreenshot: await commandExists('gnome-screenshot'),
      scrot: await commandExists('scrot'),
      import: await commandExists('import'),
    };
  }
  if (os === 'win32') {
    return {
      platform: os,
      powershell: await commandExists('powershell.exe'),
    };
  }
  return { platform: os };
}
