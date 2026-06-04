// @ts-nocheck
import { listMonitors } from "../../services/monitors/index.js";

const handleMonitorsGet = async (_req, res, { sendJson }, url) => {
  const status = url.searchParams.get("status") || undefined;
  const conversationId = url.searchParams.get("conversationId") || undefined;
  const monitors = listMonitors({ status, conversationId });
  sendJson(res, 200, { ok: true, monitors });
};

export { handleMonitorsGet };
