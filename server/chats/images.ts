// 发给模型的图片:先压缩再送。
//
// 长边缩到 1568px 以内、转 JPEG(质量 80)、去掉元数据 —— 截图从几 MB 降到一两百 KB,
// 模型看得清,token 和带宽都省。压缩结果按 路径+大小+修改时间 缓存,每次请求不必重算。
// 用 ImageMagick(magick / convert);机器上没有时,小图原样发,大图只给路径。
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { DATA_HOME } from "../system/paths.js";

const MAX_EDGE = 1568;
const QUALITY = 80;
const RAW_LIMIT = 1.5 * 1024 * 1024; // 没法压缩时,原图最大能发多大
const CACHE_DIR = path.join(DATA_HOME, "cache", "images");

let magick: string | null | undefined;
const findMagick = async () => {
  if (magick !== undefined) return magick;
  for (const cmd of ["magick", "convert"]) {
    const ok = await new Promise<boolean>((resolve) => execFile(cmd, ["-version"], (error, stdout) => resolve(!error && /ImageMagick/.test(String(stdout)))));
    if (ok) return (magick = cmd);
  }
  return (magick = null);
};

const compress = (cmd: string, src: string, out: string) => new Promise<void>((resolve, reject) => {
  // [0]:GIF/多页 TIFF 只取第一帧
  execFile(cmd, [`${src}[0]`, "-auto-orient", "-resize", `${MAX_EDGE}x${MAX_EDGE}>`, "-strip",
    "-background", "white", "-flatten", "-quality", String(QUALITY), `jpg:${out}`], { timeout: 30_000 },
  (error) => (error ? reject(error) : resolve()));
});

/** 图片 → data URL(压缩过的);发不了时返回 null,调用方改成给路径。 */
export const imageDataUrl = async (file: string, mimeType: string): Promise<string | null> => {
  let stat;
  try { stat = statSync(file); } catch { return null; }
  const cmd = await findMagick();
  if (cmd) {
    const key = createHash("sha1").update(`${file}:${stat.size}:${stat.mtimeMs}`).digest("hex");
    const out = path.join(CACHE_DIR, `${key}.jpg`);
    try {
      if (!existsSync(out)) {
        mkdirSync(CACHE_DIR, { recursive: true });
        await compress(cmd, file, out);
      }
      return `data:image/jpeg;base64,${readFileSync(out).toString("base64")}`;
    } catch { /* 压缩失败(格式不认识等)就走下面的原图兜底 */ }
  }
  if (stat.size > RAW_LIMIT) return null;
  return `data:${mimeType};base64,${readFileSync(file).toString("base64")}`;
};
