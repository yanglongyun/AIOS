// @ts-nocheck
import { parseJson } from "../shared/json.js";

const asLimit = (value, fallback = 50) =>
  Math.max(1, Math.floor(Number(value || fallback)));

const asOffset = (value) =>
  Math.max(0, Math.floor(Number(value || 0)));

const readJsonBody = async (req, readBody, label) =>
  parseJson((await readBody(req)) || "{}", label);

const requireField = (body, key, sendJson, res) => {
  if (body?.[key]) return true;
  sendJson(res, 400, { error: `Missing ${key}` });
  return false;
};

export {
  asLimit,
  asOffset,
  readJsonBody,
  requireField,
};
