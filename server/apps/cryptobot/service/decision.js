import { listDecisions as listDecisionsRepo } from "../repository/decisions.js";

const parseActions = (raw) => {
  if (Array.isArray(raw)) return raw;
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

const listDecisionRecords = ({ limit = 50 } = {}) => {
  const items = listDecisionsRepo(limit).map((d) => ({
    ...d,
    stance: d.stance || "neutral",
    headline: d.headline || "",
    actions: parseActions(d.actions)
  }));
  return { success: true, items };
};
export {
  listDecisionRecords
};
