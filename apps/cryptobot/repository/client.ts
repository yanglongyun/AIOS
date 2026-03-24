import { createAppDb } from '../../app_shared/db/createAppDb.ts';

export const db = createAppDb('cryptobot.db');

export const parseNum = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
export const nowIso = () => new Date().toISOString();
