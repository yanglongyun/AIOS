import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { broadcast } from '../../system/ws.js';

const EMOJI_RE = /\p{Extended_Pictographic}/u;
const ALLOWED_SOUNDS = new Set(['pop', 'ding', 'success']);

const pickEffect = (body = {}) => {
  if (body.effect === 'emoji' || body.effect === 'sound') return body.effect;
  if (typeof body.emoji === 'string' && EMOJI_RE.test(body.emoji)) return 'emoji';
  if (typeof body.sound === 'string') return 'sound';
  return '';
};

export const handleAvatarApi = async (req, res, path) => {
  if (path === '/api/avatar' && req.method === 'GET') {
    return json(res, { success: true, message: 'avatar api ready' });
  }

  if (path === '/api/avatar' && req.method === 'POST') {
    const body = await readBody(req);
    const effect = pickEffect(body);
    if (!effect) return json(res, { success: false, message: 'invalid effect' }, 400);

    const payload = {};
    if (effect === 'emoji') {
      const emoji = String(body.emoji || '').trim();
      if (!emoji || !EMOJI_RE.test(emoji)) {
        return json(res, { success: false, message: 'invalid emoji' }, 400);
      }
      payload.emoji = emoji.slice(0, 8);
      payload.text = String(body.text || '').trim().slice(0, 40);
      payload.durationMs = Math.max(400, Math.min(6000, Number(body.durationMs) || 1400));
    }

    if (effect === 'sound') {
      const sound = String(body.sound || '').trim();
      if (!ALLOWED_SOUNDS.has(sound)) {
        return json(res, { success: false, message: 'invalid sound' }, 400);
      }
      payload.sound = sound;
      payload.volume = Math.max(0, Math.min(1, Number(body.volume) || 0.4));
    }

    broadcast({ type: 'ui_effect', effect, payload });
    return json(res, { success: true });
  }

  return json(res, { success: false, message: 'API endpoint not found' }, 404);
};
