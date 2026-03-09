import { refreshQuestion } from '../service/refresh.js';

export const refreshHandler = async (req) => {
  return refreshQuestion(req);
};
