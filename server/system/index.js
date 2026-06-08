#!/usr/bin/env node
// @ts-nocheck

import { startServer, stopServer } from "./runtime/http.js";

if (process.argv[1] && process.argv[1].includes("server/system/index.js")) {
  const port = Number(process.env.AGENT_PORT || process.env.AIOS_MAIN_PORT) || 9502;
  startServer(port).catch(console.error);
}

export { startServer, stopServer };
