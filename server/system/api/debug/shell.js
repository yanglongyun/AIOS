// @ts-nocheck
import { shell } from "../../ai/functions.js";
import { parseJson } from "../shared/json.js";

const isLocalRequest = (req) => {
  const address = String(req.socket?.remoteAddress || "").trim();
  return (
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1" ||
    address === ""
  );
};

const handleDebugShell = async (req, res, { readBody, sendJson }) => {
  if (!isLocalRequest(req)) {
    sendJson(res, 403, { ok: false, error: "Debug shell only allows local requests" });
    return;
  }

  const body = parseJson(await readBody(req), "debug shell body");
  const command = String(body.command || "").trim();
  if (!command) {
    sendJson(res, 400, { ok: false, error: "Missing command" });
    return;
  }

  const cwd = String(body.cwd || "").trim();
  const output = await shell({
    command,
    cwd,
    timeout: body.timeout,
    mode: body.mode,
  });

  sendJson(res, 200, {
    ok: true,
    cwd: cwd || process.cwd(),
    output,
  });
};

export { handleDebugShell };
