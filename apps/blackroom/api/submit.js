import { submit } from '../service/submit.js';

export const submitHandler = async (body = {}, req) => {
  const complaint = String(body.complaint || '').trim();
  const poopCount = Math.max(0, Number(body.poopCount) || 0);

  if (!complaint && poopCount <= 0) {
    return { status: 400, message: '请至少填写不满内容或点击一个 💩' };
  }

  return await submit({ complaint, poopCount, req });
};
