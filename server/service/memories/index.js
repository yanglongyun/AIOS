// @ts-nocheck
import {
  countMemoryRows,
  createMemoryRow,
  getMemoryRow,
  listMemoryRows,
  removeMemoryRow,
  searchMemoryRows,
  updateMemoryRow,
} from "../../repository/memories/index.js";

const VISIBILITIES = new Set(["must", "star", "stored"]);
const DEFAULT_USER = "default";

const normalizeUserId = (value) => String(value || DEFAULT_USER).trim() || DEFAULT_USER;
const normalizeVisibility = (value) => {
  const visibility = String(value || "stored").trim();
  if (!VISIBILITIES.has(visibility)) throw new Error("Unsupported memory visibility");
  return visibility;
};
const normalizeTitle = (value) => {
  const title = String(value || "").trim();
  if (!title) throw new Error("Memory title is required");
  return title;
};
const normalizeText = (value) => String(value || "").trim();

const listMemories = ({ userId = DEFAULT_USER, visibility = "", limit = 200 } = {}) =>
  listMemoryRows({
    userId: normalizeUserId(userId),
    visibility: visibility ? normalizeVisibility(visibility) : "",
    limit,
  });

const searchMemories = ({ userId = DEFAULT_USER, query = "", limit = 20 } = {}) =>
  searchMemoryRows({ userId: normalizeUserId(userId), query, limit });

const getMemory = ({ id, userId = DEFAULT_USER }) => getMemoryRow({ id, userId: normalizeUserId(userId) });

const createMemory = (input = {}) =>
  createMemoryRow({
    userId: normalizeUserId(input.userId || input.user_id),
    title: normalizeTitle(input.title),
    description: normalizeText(input.description),
    body: normalizeText(input.body),
    visibility: normalizeVisibility(input.visibility),
  });

const updateMemory = ({ id, userId = DEFAULT_USER, ...input }) => {
  const existing = getMemory({ id, userId });
  if (!existing) return null;
  return updateMemoryRow({
    id,
    userId: normalizeUserId(userId),
    title: input.title == null ? existing.title : normalizeTitle(input.title),
    description: input.description == null ? existing.description : normalizeText(input.description),
    body: input.body == null ? existing.body : normalizeText(input.body),
    visibility: input.visibility == null ? existing.visibility : normalizeVisibility(input.visibility),
  });
};

const deleteMemory = ({ id, userId = DEFAULT_USER }) => removeMemoryRow({ id, userId: normalizeUserId(userId) });

const getMemoryPromptContext = ({ userId = DEFAULT_USER } = {}) => {
  const normalizedUserId = normalizeUserId(userId);
  const must = listMemoryRows({ userId: normalizedUserId, visibility: "must", limit: 100 });
  const star = listMemoryRows({ userId: normalizedUserId, visibility: "star", limit: 100 });
  const storedCount = countMemoryRows({ userId: normalizedUserId, visibility: "stored" });
  return { must, star, storedCount };
};

export {
  createMemory,
  deleteMemory,
  getMemory,
  getMemoryPromptContext,
  listMemories,
  searchMemories,
  updateMemory,
};
