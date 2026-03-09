import { markRead } from '../service/read.js';

export const readHandler = (body) => {
  return markRead(body);
};
