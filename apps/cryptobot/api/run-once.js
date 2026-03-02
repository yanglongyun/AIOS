import { runBotOnce } from '../service.js';

export const runOnceHandler = async () => {
  const data = await runBotOnce();
  return { success: true, ...data };
};
