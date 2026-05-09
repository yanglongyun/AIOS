import { createAppDb } from "../../../shared/apps/db/createAppDb.js";

const db = createAppDb("workshop.sqlite");

export {
  db
};
