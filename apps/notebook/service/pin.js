import { setNotePinned } from '../repository/pin.js';

export const pinNotebook = (body = {}) => {
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return { error: '缺少 id', status: 400 };
  setNotePinned({ id, pinned: body.pinned ? 1 : 0 });
  return { ok: true };
};
