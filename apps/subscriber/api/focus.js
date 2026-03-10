import { updateFocus } from '../service/focus.js';

export const focusHandler = (body) => {
  return updateFocus(body);
};
