// @ts-nocheck
import { listSubscriptions } from "../service/subscriptions/index.js";

const readLimit = (value) => Math.max(1, Math.min(500, Number.parseInt(value, 10) || 200));

const handleSubscriptionsApi = async (_req, res, { sendJson }, path, method, url) => {
  if (path !== "/api/subscriptions" || method !== "GET") {
    sendJson(res, 404, { error: "API endpoint not found" });
    return;
  }

  sendJson(res, 200, {
    ok: true,
    subscriptions: listSubscriptions({ limit: readLimit(url.searchParams.get("limit")) }),
  });
};

export { handleSubscriptionsApi };
