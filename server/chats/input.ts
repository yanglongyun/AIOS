import { MAX_ATTACHMENT_BYTES } from "../files/attachments.js";
import { imageDataUrl } from "./images.js";

/** 整段对话里最多展开多少张图(从最新往回数);更早的只留路径。 */
const MAX_LIVE_IMAGES = 5;

const folded = (file: string, why = "较早的图片已折叠") => `[${why}: ${file} —— 需要再看时用 read 打开]`;

/**
 * 请求前的输入整形(注入内核的 prepareInput):
 *   - 图片(用户附件、read / browser / computer 返回的图)从最新往回数,前 MAX_LIVE_IMAGES 张
 *     压缩后展开成 input_image,更早的换成一行路径;
 *   - 用户的非图片附件一律给本地路径;
 *   - 剥掉 attachments / image 这些协议不认的字段。
 */
export const prepareInput = async (items: any[]) => {
  let live = 0;
  const output: any[] = [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];

    if (item?.role === "user" && item.attachments?.length) {
      const parts: any[] = [];
      const text = typeof item.content === "string" ? item.content : "";
      if (text) parts.push({ type: "input_text", text });
      // 同一条消息里的图按出现顺序,但配额从最新的消息开始扣
      for (const attachment of item.attachments) {
        const isImage = String(attachment.mimeType).startsWith("image/") && attachment.size <= MAX_ATTACHMENT_BYTES;
        if (isImage && live < MAX_LIVE_IMAGES) {
          const url = await imageDataUrl(attachment.path, attachment.mimeType);
          if (url) { live += 1; parts.push({ type: "input_image", image_url: url }); continue; }
          parts.push({ type: "input_text", text: folded(attachment.path, "图片太大、无法压缩") });
        } else if (isImage) {
          parts.push({ type: "input_text", text: folded(attachment.path) });
        } else {
          parts.push({ type: "input_text", text: `[本地文件: ${attachment.name}\n路径: ${attachment.path}]` });
        }
      }
      output.unshift({ role: "user", content: parts });
      continue;
    }

    if (item?.type === "function_call_output" && item.image?.path) {
      const text = String(item.output || "");
      if (live < MAX_LIVE_IMAGES) {
        const url = await imageDataUrl(item.image.path, item.image.mimeType || "image/png");
        if (url) {
          live += 1;
          output.unshift({ type: item.type, call_id: item.call_id, output: [
            { type: "input_text", text },
            { type: "input_image", image_url: url },
          ] });
          continue;
        }
      }
      output.unshift({ type: item.type, call_id: item.call_id, output: `${text}\n${folded(item.image.path)}` });
      continue;
    }

    if (item?.attachments || item?.image) {
      const clean = { ...item };
      delete clean.attachments;
      delete clean.image;
      output.unshift(clean);
    } else {
      output.unshift(item);
    }
  }
  return output;
};
