import { pinNotebook } from '../service/pin.js';

export const pinHandler = (body = {}) => {
  return pinNotebook(body);
};
