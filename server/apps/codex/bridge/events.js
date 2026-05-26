const pickItemText = (item) => {
  if (!item) return "";
  if (typeof item.text === "string") return item.text;
  if (typeof item.message === "string") return item.message;
  if (typeof item.content === "string") return item.content;
  if (Array.isArray(item.content)) {
    return item.content
      .map((part) => typeof part === "string" ? part : (part?.text ?? part?.content ?? ""))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof item.command === "string") return item.command;
  if (Array.isArray(item.command)) return item.command.join(" ");
  if (Array.isArray(item.commandLine)) return item.commandLine.join(" ");
  return "";
};

const pickItemMeta = (item) => {
  if (!item) return null;
  const meta = {};
  if (item.type) meta.type = item.type;
  if (item.exitCode !== undefined) meta.exitCode = item.exitCode;
  if (item.exit_code !== undefined) meta.exitCode = item.exit_code;
  if (item.stdout) meta.stdout = String(item.stdout).slice(0, 2000);
  if (item.stderr) meta.stderr = String(item.stderr).slice(0, 2000);
  if (item.command) meta.command = item.command;
  if (item.path) meta.path = item.path;
  if (item.name) meta.name = item.name;
  if (item.arguments) meta.arguments = item.arguments;
  return Object.keys(meta).length ? meta : null;
};

const codexItemKind = (type) => {
  const value = String(type || "").toLowerCase();
  if (!value) return "raw";
  if (/reason/.test(value)) return "reasoning";
  if (/command|shell|exec/.test(value)) return "command";
  if (/tool/.test(value)) return "tool";
  if (/file/.test(value)) return "file";
  if (/message/.test(value)) return "message";
  return value;
};

const normalizeCodexEvent = (message) => {
  const method = String(message?.method || "");
  const params = message?.params || {};

  if (method === "turn/started") {
    return { type: "turn_started", turnId: params?.turn?.id || null };
  }
  if (method === "turn/completed") {
    return { type: "turn_completed" };
  }
  if (method === "turn/plan/updated") {
    return { type: "plan", plan: params?.plan ?? params };
  }
  if (method === "item/agentMessage/delta") {
    return { type: "delta", itemId: params?.itemId || null, text: params?.delta || "" };
  }
  if (method === "item/agentReasoning/delta") {
    return { type: "reasoning_delta", itemId: params?.itemId || null, text: params?.delta || "" };
  }
  if (method === "item/started") {
    const item = params?.item || {};
    return { type: "item_started", itemId: item.id || null, kind: codexItemKind(item.type || item.kind), text: pickItemText(item) };
  }
  if (method === "item/completed") {
    const item = params?.item || {};
    return {
      type: "item_completed",
      itemId: item.id || null,
      kind: codexItemKind(item.type || item.kind),
      text: pickItemText(item),
      meta: pickItemMeta(item),
    };
  }
  if (method === "error") {
    return { type: "error", message: params?.message || "Codex error" };
  }
  return null;
};

export { normalizeCodexEvent };
