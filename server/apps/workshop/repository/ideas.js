import { db } from "./client.js";

const listIdeas = () => db.prepare(`
  SELECT id, title, category, summary, prompt, created_at, updated_at
  FROM workshop_ideas
  ORDER BY category ASC, title ASC
`).all();

export {
  listIdeas
};
