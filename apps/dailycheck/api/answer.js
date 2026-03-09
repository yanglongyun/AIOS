import { submitAnswer } from '../service/answer.js';

export const answerHandler = async (body, req) => {
  return submitAnswer(body, req);
};
