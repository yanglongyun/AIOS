// @ts-nocheck
import { startServer } from "./server/system/index.js";
import { startAppsServer } from "./server/apps/index.js";

const port = Number(process.env.AGENT_PORT) || 9502;
const appsPort = Number(process.env.AGENT_APPS_PORT) || 9503;

console.log(`Starting AGENT server on port ${port}...`);
await startServer(port);
await startAppsServer(appsPort);
