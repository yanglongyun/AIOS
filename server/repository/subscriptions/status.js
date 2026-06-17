// @ts-nocheck
import { getDb } from "../db.js";

const markSubscriptionFired = (id) => {
  getDb()
    .prepare("UPDATE subscriptions SET status = 'fired', fired_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(Number(id));
};

export { markSubscriptionFired };
