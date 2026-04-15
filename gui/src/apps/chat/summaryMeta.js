const SUMMARY_BLOCK_RE = /(?:\r?\n)?<<<summary\r?\n([\s\S]+?)\r?\n>>>\s*$/i;
const COMMAND_BLOCK_RE = /(?:\r?\n)?<<<command\r?\n([\s\S]+?)\r?\n>>>\s*$/i;
const COMMAND_TYPES = new Set(['intent', 'task', 'shell']);

const normalizeCommand = (raw = {}) => {
  const type = String(raw.type || '').trim().toLowerCase();
  if (!COMMAND_TYPES.has(type)) return null;
  const label = String(raw.label || '').trim();
  const run = String(raw.run || '').trim();
  const extras = {};
  for (const [key, value] of Object.entries(raw)) {
    if (['type', 'label', 'run'].includes(key)) continue;
    extras[key] = value;
  }
  return {
    type,
    label,
    run,
    raw: { ...raw },
    ...extras
  };
};

const parseCommandBlock = (block = '') => {
  try {
    return normalizeCommand(JSON.parse(String(block || '').trim()));
  } catch {
    return null;
  }
};

const parseSummaryBlock = (block = '') => {
  try {
    const parsed = JSON.parse(String(block || '').trim());
    return String(parsed?.text || '').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
};

const splitAssistantMeta = (content = '') => {
  let raw = String(content || '').trimEnd();
  let summary = '';
  let command = null;
  let changed = true;

  while (changed) {
    changed = false;

    const summaryMatch = raw.match(SUMMARY_BLOCK_RE);
    if (summaryMatch) {
      summary = summary || parseSummaryBlock(summaryMatch[1] || '');
      raw = raw.slice(0, summaryMatch.index).trimEnd();
      changed = true;
      continue;
    }

    const commandMatch = raw.match(COMMAND_BLOCK_RE);
    if (commandMatch) {
      command = command || parseCommandBlock(commandMatch[1] || '');
      raw = raw.slice(0, commandMatch.index).trimEnd();
      changed = true;
    }
  }

  return {
    content: raw,
    summary,
    command
  };
};

const splitAssistantSummary = (content = '') => {
  const parsed = splitAssistantMeta(content);
  return {
    content: parsed.content,
    summary: parsed.summary
  };
};

export {
  parseCommandBlock,
  splitAssistantMeta,
  splitAssistantSummary
};
