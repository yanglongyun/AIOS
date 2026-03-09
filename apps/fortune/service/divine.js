import { instantTaskJson } from '../../app_shared/instantTask.js';
import { insertRecord } from '../repository/divine.js';

export const divine = async ({ question, hexagram, yaos, req }) => {
  const parsed = await instantTaskJson({
    app: 'fortune',
    title: '周易解卦',
    schema: { required: ['signName', 'signPoem', 'good', 'bad', 'advice'] },
    prompt: '请根据给定卦象完成解卦，按 schema 输出 JSON。',
    messages: [{
      role: 'system',
      content: `你是一位精通周易六爻的卦师，学识渊博、文笔古雅。
用户通过摇铜钱起卦，已经得到了具体的卦象。请基于此卦象为用户解卦。

要求：
1. signName：给出卦象评价（如"大吉"、"中吉"、"小吉"、"中平"、"小凶"、"大凶"）
2. signPoem：写一首原创四句七言签诗，有古韵，切合卦象与问题
3. good：宜做之事（2-3项，逗号分隔）
4. bad：忌做之事（2-3项，逗号分隔）
5. advice：结合卦象和问题给出解读建议（80-120字，有易经味道但通俗实用）。请务必注意言辞不要过于绝对，可适当带入"尽人事，听天命"或"科学理性看待、仅供娱乐参考"的寓意，告诉用户算卦不要太当真。

注意：解读必须紧扣所得卦象"${hexagram}"的卦义，不可随意发挥。

必须返回 JSON：
{"signName":"评价","signPoem":"签诗","good":"宜","bad":"忌","advice":"建议"}`
    }, {
      role: 'user',
      content: `我的问题：${question}\n所得卦象：${hexagram}\n爻象（初爻到上爻）：${yaos}`
    }],
    req
  });

  const record = {
    question,
    signName: String(parsed.signName || '').trim() || '未知',
    signPoem: String(parsed.signPoem || '').trim() || '',
    good: String(parsed.good || '').trim() || '',
    bad: String(parsed.bad || '').trim() || '',
    advice: String(parsed.advice || '').trim() || '',
    hexagram
  };

  const item = insertRecord(record);
  return { success: true, item };
};
