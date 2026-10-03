// computer:操作这台机器的图形桌面 —— 截屏看,鼠标点,键盘敲。
// 走 X11(xdotool + ImageMagick),适合浏览器以外的桌面软件;网页优先用 browser 工具,更准更省。
// 需要一个图形桌面:有 DISPLAY(或 AIOS_DISPLAY)且装了 xdotool、imagemagick。
//
// 截图超过 1280 宽会缩小再给模型(省 token、也更接近模型训练时的分辨率),
// 模型给的坐标始终按截图算,这里换算回真实屏幕坐标。
import { execFile } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { resolveLocalPath } from "../paths.js";

const MAX_WIDTH = 1280;

export const computerDef = {
  type: "function",
  name: "computer",
  description:
    "操作这台机器的图形桌面(远程桌面里用户看得见)。用于浏览器以外的桌面软件;网页请优先用 browser。" +
    "先 screenshot 看屏幕,坐标都按截图的像素算(左上角为 0,0)。" +
    "动作:screenshot 截屏;click/double_click/right_click 点击(x,y);move 移动鼠标;drag 从 (x,y) 拖到 (to_x,to_y);" +
    "type 输入文字;key 按键或组合键(xdotool 键名,如 Return、Escape、ctrl+c、ctrl+shift+t、alt+F4);" +
    "scroll 滚动(direction=up/down/left/right,amount 格数);cursor 读当前鼠标位置。" +
    "除 screenshot/cursor 外,动作做完会自动再截一张图给你确认结果(不需要可传 screenshot:false)。",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string", description: "一句话说明这次操作的目的(界面会显示)" },
      action: {
        type: "string",
        enum: ["screenshot", "click", "double_click", "right_click", "move", "drag", "type", "key", "scroll", "cursor"],
      },
      x: { type: "number", description: "截图坐标 x" },
      y: { type: "number", description: "截图坐标 y" },
      to_x: { type: "number", description: "drag:终点 x" },
      to_y: { type: "number", description: "drag:终点 y" },
      text: { type: "string", description: "type:要输入的文字" },
      keys: { type: "string", description: "key:xdotool 键名,组合键用 + 连接,多个按键用空格分开" },
      direction: { type: "string", enum: ["up", "down", "left", "right"], description: "scroll:方向,默认 down" },
      amount: { type: "number", description: "scroll:滚几格,默认 5" },
      screenshot: { type: "boolean", description: "动作后是否自动截图,默认 true" },
    },
    required: ["summary", "action"],
    additionalProperties: false,
  },
};

const display = () => process.env.AIOS_DISPLAY || process.env.DISPLAY || "";

const run = (cmd: string, args: string[], timeout = 20_000) => new Promise<string>((resolve, reject) => {
  execFile(cmd, args, { timeout, env: { ...process.env, DISPLAY: display() }, maxBuffer: 4 * 1024 * 1024 }, (error: any, stdout, stderr) => {
    if (error) {
      if (error.code === "ENOENT") reject(new Error(`缺少命令 ${cmd}。在服务器上装上:apt install -y xdotool imagemagick`));
      else reject(new Error(String(stderr || error.message).trim().slice(0, 500)));
      return;
    }
    resolve(String(stdout).trim());
  });
});

/** 真实屏幕尺寸与截图缩放比(截图坐标 × scale = 屏幕坐标)。 */
const geometry = async () => {
  const [w, h] = (await run("xdotool", ["getdisplaygeometry"])).split(/\s+/).map(Number);
  const scale = w > MAX_WIDTH ? w / MAX_WIDTH : 1;
  return { w, h, scale };
};

const toScreen = (value: unknown, scale: number) => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("需要 x、y 坐标(按截图像素)");
  return String(Math.round(n * scale));
};

const shoot = async (ctx: Record<string, any>, note: string) => {
  const { w, h, scale } = await geometry();
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  const abs = resolveLocalPath(join(ctx.outputDir || ctx.cwd || "~", "screens", `screen-${stamp}-${Date.now() % 1000}.png`));
  mkdirSync(dirname(abs), { recursive: true });
  const args = ["-window", "root"];
  if (scale > 1) args.push("-resize", `${MAX_WIDTH}x`);
  await run("import", [...args, abs], 30_000);
  const size = statSync(abs).size;
  const shotW = Math.round(w / scale), shotH = Math.round(h / scale);
  return {
    output: `${note}截图 ${shotW}×${shotH}(屏幕 ${w}×${h}),已交给你查看;坐标按截图像素给。`,
    image: { path: abs, mimeType: "image/png", size },
  };
};

const BUTTON: Record<string, string> = { click: "1", double_click: "1", right_click: "3" };
const SCROLL: Record<string, string> = { up: "4", down: "5", left: "6", right: "7" };

export const computer = async (args: Record<string, any>, ctx: Record<string, any>) => {
  const action = String(args.action || "");
  if (!display()) {
    return "error: 这台机器没有图形桌面(没有 DISPLAY)。需要先装桌面和远程桌面(例如 Xfce + VNC),并用 AIOS_DISPLAY=:1 告诉 AIOS 用哪个显示器。";
  }
  try {
    if (action === "screenshot") return await shoot(ctx, "");
    const { scale } = await geometry();
    if (action === "cursor") {
      const out = await run("xdotool", ["getmouselocation", "--shell"]);
      const x = Number(out.match(/X=(\d+)/)?.[1]), y = Number(out.match(/Y=(\d+)/)?.[1]);
      return `鼠标在截图坐标 (${Math.round(x / scale)}, ${Math.round(y / scale)})`;
    }

    switch (action) {
      case "click": case "double_click": case "right_click":
        await run("xdotool", ["mousemove", "--sync", toScreen(args.x, scale), toScreen(args.y, scale),
          "click", ...(action === "double_click" ? ["--repeat", "2", "--delay", "80"] : []), BUTTON[action]]);
        break;
      case "move":
        await run("xdotool", ["mousemove", "--sync", toScreen(args.x, scale), toScreen(args.y, scale)]);
        break;
      case "drag":
        await run("xdotool", ["mousemove", "--sync", toScreen(args.x, scale), toScreen(args.y, scale), "mousedown", "1",
          "mousemove", "--sync", toScreen(args.to_x, scale), toScreen(args.to_y, scale), "mouseup", "1"]);
        break;
      case "type":
        if (args.text == null) return "error: type 需要 text";
        await run("xdotool", ["type", "--delay", "12", "--", String(args.text)], 120_000);
        break;
      case "key": {
        const keys = String(args.keys || "").trim().split(/\s+/).filter(Boolean);
        if (!keys.length) return "error: key 需要 keys,例如 Return 或 ctrl+c";
        await run("xdotool", ["key", "--delay", "40", ...keys]);
        break;
      }
      case "scroll": {
        if (args.x != null && args.y != null) await run("xdotool", ["mousemove", "--sync", toScreen(args.x, scale), toScreen(args.y, scale)]);
        const button = SCROLL[String(args.direction || "down")] || SCROLL.down;
        await run("xdotool", ["click", "--repeat", String(Math.max(1, Math.min(30, Number(args.amount) || 5))), "--delay", "30", button]);
        break;
      }
      default:
        return `error: 未知 action: ${action}`;
    }

    if (args.screenshot === false) return "ok";
    await new Promise((r) => setTimeout(r, 400)); // 等界面反应过来再看
    return await shoot(ctx, "ok。操作后的");
  } catch (error: any) {
    return `error: ${error?.message || error}`;
  }
};
