const reply = (sendRaw, id, result) => {
  sendRaw({ jsonrpc: "2.0", id, result });
};

const replyError = (sendRaw, id, code, message) => {
  sendRaw({ jsonrpc: "2.0", id, error: { code, message } });
};

const handleCodexServerRequest = (message, sendRaw) => {
  const method = String(message.method || "");

  if (method === "applyPatchApproval" || method === "execCommandApproval") {
    reply(sendRaw, message.id, { decision: "denied" });
    return true;
  }

  if (method === "item/commandExecution/requestApproval" || method === "item/fileChange/requestApproval") {
    reply(sendRaw, message.id, { decision: "decline" });
    return true;
  }

  if (method === "item/permissions/requestApproval") {
    reply(sendRaw, message.id, { permissions: {}, scope: "turn", strictAutoReview: true });
    return true;
  }

  if (method === "item/tool/requestUserInput") {
    reply(sendRaw, message.id, { answers: {} });
    return true;
  }

  if (method === "item/tool/call") {
    replyError(sendRaw, message.id, -32601, "AIOS Codex bridge does not expose dynamic tools yet");
    return true;
  }

  return false;
};

export { handleCodexServerRequest };
