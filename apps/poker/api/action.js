import { performAction } from '../service/action.js';

export const actionHandler = async (body = {}, req) => {
  const id = Number(body.id || 0);
  const action = String(body.action || '');
  return performAction({ id, action, req });
};
