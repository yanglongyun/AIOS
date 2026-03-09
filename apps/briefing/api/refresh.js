import { refresh } from '../service/refresh.js';

export const refreshHandler = async (body, req) => {
  return refresh(body, req);
};
