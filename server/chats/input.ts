import { MAX_ATTACHMENT_BYTES } from "../files/attachments.js";
import { imageDataUrl } from "./images.js";

/** 整段对话里最多展开多少张图(从最新往回数);更早的只留路径。 */
const MAX_LIVE_IMAGES = 5;

const folded = (file: string, why = "较早的图片已折叠") => `[${why}: ${file} —— 需要再看时用 read 打开]`;

/**
 * 工具调用配对整理。Responses 接口(尤其 Kimi 这类内部转成 chat 格式的)要求:
 * 每个 function_call 都有 function_call_output,且结果紧跟在调用后面。历史里几种情况会破坏它:
 *   - AI 运行中用户又发了消息:用户消息落库在「调用」和「结果」之间;
 *   - 服务重启/崩溃时工具正在跑:调用落库了,结果永远没有;
 *   - 压缩的切分点落在调用和结果之间:结果前面没有调用。
 * 整理规则:连续的一组调用后面紧跟它们各自的结果;缺结果的补一条「已中断」;
 * 找不到调用的孤立结果丢掉;重复的 call_id 只留第一个。夹在中间的其他消息挪到这组结果之后。
 */
export const pairToolCalls = (items: any[]) => {
  const outputs = new Map<string, any>();
  for (const item of items) {
    if (item?.type === "function_call_output" && item.call_id && !outputs.has(String(item.call_id))) outputs.set(String(item.call_id), item);
  }
  const result: any[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item?.type === "function_call_output") continue; // 结果统一跟着调用放
    if (item?.type !== "function_call") { result.push(item); continue; }
    // 一组连续的调用(中间可以夹 reasoning),整组放完再放结果
    const group: any[] = [];
    for (; i < items.length && (items[i]?.type === "function_call" || items[i]?.type === "reasoning"); i += 1) {
      const it = items[i];
      if (it.type === "function_call") {
        const id = String(it.call_id || "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
      }
      group.push(it);
    }
    i -= 1;
    result.push(...group);
    for (const call of group) {
      if (call.type !== "function_call") continue;
      result.push(outputs.get(String(call.call_id))
        || { type: "function_call_output", call_id: call.call_id, output: "error: 这次调用没有结果(执行被中断)" });
    }
  }
  return result;
};

/**
 * 请求前的输入整形(注入内核的 prepareInput):
 *   - 图片(用户附件、read / browser / computer 返回的图)从最新往回数,前 MAX_LIVE_IMAGES 张
 *     压缩后展开成 input_image,更早的换成一行路径;
 *   - 用户的非图片附件一律给本地路径;
 *   - 剥掉 attachments / image 这些协议不认的字段;
 *   - 先做工具调用配对整理(pairToolCalls)。
 */
export const prepareInput = async (raw: any[]) => {
  const items = pairToolCalls(raw);
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
