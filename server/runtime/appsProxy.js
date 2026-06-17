// @ts-nocheck
import { handleAppsRequest } from "../apps/index.js";

const proxyApps = (req, res) => handleAppsRequest(req, res);

export { proxyApps };
