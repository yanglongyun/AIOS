import { spawn } from "child_process";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../../..");

const W = 1920;
const H = 1080;

const run = (cmd, args) => new Promise((resolveRun, reject) => {
  const child = spawn(cmd, args);
  let stderr = "";
  child.stderr.on("data", (d) => { stderr += d.toString(); });
  child.on("error", (err) => reject(new Error(`${cmd} 启动失败：${err.message}（请确认已安装 ffmpeg）`)));
  child.on("close", (code) => {
    if (code === 0) return resolveRun(stderr);
    reject(new Error(`${cmd} 退出码 ${code}：${stderr.slice(-400)}`));
  });
});

const hasFfmpeg = async () => {
  try {
    await run("ffmpeg", ["-version"]);
    await run("ffprobe", ["-version"]);
    return true;
  } catch {
    return false;
  }
};

// 用 ffprobe 读音频真实时长（秒）。
const probeDuration = async (file) => {
  if (!file || !existsSync(file)) return 0;
  const out = await new Promise((resolveProbe, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", file,
    ]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", (err) => reject(new Error(`ffprobe 启动失败：${err.message}`)));
    child.on("close", (code) => code === 0 ? resolveProbe(stdout) : reject(new Error(stderr.slice(-200))));
  });
  const n = parseFloat(String(out).trim());
  return Number.isFinite(n) ? n : 0;
};

// 单段：静态图 + 音频 → 一个 mp4 片段，时长对齐音频。
const renderClip = async ({ image, audio, durationSec, out }) => {
  const dur = Math.max(1, Number(durationSec) || 1);
  await run("ffmpeg", [
    "-y",
    "-loop", "1", "-i", image,
    "-i", audio,
    "-c:v", "libx264", "-tune", "stillimage", "-pix_fmt", "yuv420p",
    "-vf", `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`,
    "-r", "30",
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
    "-t", String(dur),
    out,
  ]);
  return out;
};

// 拼接所有片段 → final.mp4。片段编码参数一致，使用 concat demuxer + copy。
const concatClips = async ({ clips, out }) => {
  const dir = dirname(out);
  const listFile = join(dir, "concat.txt");
  const body = clips.map((c) => `file '${c.replace(/'/g, "'\\''")}'`).join("\n");
  writeFileSync(listFile, body);
  await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", out]);
  try { rmSync(listFile); } catch { /* ignore */ }
  return out;
};

// 渲染整个项目：逐段出片，再拼接。onProgress(done, total) 用于上报进度。
const renderProject = async ({ projectId, segments, onProgress }) => {
  const outDir = join(root, "files", "exports", "longvideo", String(projectId));
  const clipsDir = join(outDir, "clips");
  mkdirSync(clipsDir, { recursive: true });

  const ordered = [...segments].sort((a, b) => a.index - b.index);
  const total = ordered.length;
  const clips = [];

  for (let i = 0; i < ordered.length; i += 1) {
    const seg = ordered[i];
    if (!seg.imageLocal || !existsSync(seg.imageLocal)) throw new Error(`第 ${seg.index} 段缺少图片素材`);
    if (!seg.audioLocal || !existsSync(seg.audioLocal)) throw new Error(`第 ${seg.index} 段缺少音频素材`);
    const dur = seg.audioDuration > 0 ? seg.audioDuration : await probeDuration(seg.audioLocal);
    const clip = join(clipsDir, `clip-${String(seg.index).padStart(3, "0")}.mp4`);
    await renderClip({ image: seg.imageLocal, audio: seg.audioLocal, durationSec: dur, out: clip });
    clips.push(clip);
    onProgress?.(i + 1, total);
  }

  const finalPath = join(outDir, "final.mp4");
  await concatClips({ clips, out: finalPath });
  return finalPath;
};

export {
  hasFfmpeg,
  probeDuration,
  renderProject,
};
