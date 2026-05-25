import { platform } from 'node:os';
import { resolve } from 'node:path';
import { commandExists, defaultScreenshotPath, ensureParent, fileSize, run } from './utils.js';

export async function screenshot(args) {
  const outputPath = resolve(String(args.outputPath || defaultScreenshotPath()));
  const os = platform();
  if (os === 'darwin') return macScreenshot(outputPath);
  if (os === 'linux') return linuxScreenshot(outputPath);
  if (os === 'win32') return windowsScreenshot(outputPath);
  throw new Error(`unsupported_platform: ${os}`);
}

async function macScreenshot(outputPath) {
  await ensureParent(outputPath);
  await run('screencapture', ['-x', '-t', 'png', outputPath]);
  return { outputPath, format: 'png', bytes: await fileSize(outputPath) };
}

async function linuxScreenshot(outputPath) {
  await ensureParent(outputPath);
  if (await commandExists('gnome-screenshot')) {
    await run('gnome-screenshot', ['-f', outputPath]);
  } else if (await commandExists('scrot')) {
    await run('scrot', [outputPath]);
  } else if (await commandExists('import')) {
    await run('import', ['-window', 'root', outputPath]);
  } else {
    throw new Error('missing_linux_screenshot_tool: install gnome-screenshot, scrot, or imagemagick');
  }
  return { outputPath, format: 'png', bytes: await fileSize(outputPath) };
}

async function windowsScreenshot(outputPath) {
  await ensureParent(outputPath);
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bmp.Save(${JSON.stringify(outputPath)}, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bmp.Dispose()
`;
  await run('powershell.exe', ['-NoProfile', '-Command', script]);
  return { outputPath, format: 'png', bytes: await fileSize(outputPath) };
}
