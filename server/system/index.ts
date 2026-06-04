#!/usr/bin/env node
// @ts-nocheck

import { startServer, stopServer } from "./runtime/http.js";

if (process.argv[1] && process.argv[1].includes("server/system/index.ts")) {
  const port = Number(process.env.AGENT_PORT) || 9502;
  startServer(port).catch(console.error);
}

export { startServer, stopServer };
