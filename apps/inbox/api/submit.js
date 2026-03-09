import { submitMessage } from '../service/submit.js';

export const submitHandler = (body, sourceIp) => {
  return submitMessage(body, sourceIp);
};
