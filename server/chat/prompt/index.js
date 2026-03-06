import { countUnread } from '../../api/notifications/list.js';
import { getSettings } from '../../db/settings.js';
import { getAppsCatalog } from './apps.js';
import { getRecentChats } from './chats.js';
import { getVisibleScriptsCatalog } from './scripts.js';
import { getInstruction, getMemoryIndexOverview } from './base.js';
import {
  buildAppsSection,
  buildEnvironmentSection,
  buildLanguageSection,
  buildMemorySection,
  buildModelSection,
  buildSessionContextSection,
  buildToolSection,
  buildUnreadNotificationSection,
  buildVisibleScriptsSection
} from './sections.js';

export const buildSystemPrompt = (currentConversationId = '') => {
  const settings = getSettings();
  const {
    apiUrl,
    model,
    provider,
    language,
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  } = settings;

  const appsCatalog = getAppsCatalog();
  const scriptsCatalog = getVisibleScriptsCatalog();
  const recentChats = getRecentChats();
  const cwd = process.cwd();
  const unread = countUnread();

  let prompt = getInstruction();
  prompt += buildLanguageSection(language);
  prompt += buildMemorySection(getMemoryIndexOverview());
  prompt += buildEnvironmentSection(cwd);
  prompt += buildModelSection({ provider, model, apiUrl });
  prompt += buildToolSection({
    enableToolResultTruncate,
    toolResultMaxChars,
    enableToolLoopLimit,
    toolMaxRounds
  });
  prompt += buildAppsSection(appsCatalog);
  prompt += buildVisibleScriptsSection(scriptsCatalog);
  prompt += buildSessionContextSection(currentConversationId, recentChats);
  prompt += buildUnreadNotificationSection(unread);

  return prompt;
};
