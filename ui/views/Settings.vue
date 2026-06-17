<script setup>
import { inject, onMounted, reactive, ref, watch } from 'vue';
import { applyAppearance, normalizeLanguage, normalizeTheme } from '../lib/appearance.js';
import { t } from '../lib/locale.js';

const setPageNav = inject('pageNav');
const status = ref('');
const loading = ref(false);
const error = ref('');
const activeTab = ref('model');
const promptPreview = ref({ custom: '', full: '' });
let previewTimer = null;

const settings = reactive({
  apiUrl: '',
  apiKey: '',
  model: '',
  system: '',
  compressThreshold: '12000',
  compactPrompt: '',
  maxRounds: '50',
  toolResultMaxChars: '12000',
  theme: 'light',
  language: 'zh',
});

async function loadSettings() {
  loading.value = true;
  error.value = '';
  status.value = '';
  try {
    const settingsRes = await fetch('/api/settings');
    const settingsData = await settingsRes.json();
    Object.assign(settings, settingsData);
    settings.theme = normalizeTheme(settings.theme);
    settings.language = normalizeLanguage(settings.language);
    applyAppearance(settings);
    await loadPromptPreview();
  } catch (err) {
    error.value = err.message || t('settings_load_failed', 'Load failed');
  } finally {
    loading.value = false;
  }
}

async function loadPromptPreview() {
  const res = await fetch('/api/settings/prompt-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  promptPreview.value = await res.json();
}

function schedulePromptPreview() {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    loadPromptPreview().catch(() => {});
  }, 250);
}

async function saveSettings() {
  status.value = t('settings_saving', 'Saving...');
  error.value = '';
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    Object.assign(settings, await res.json());
    settings.theme = normalizeTheme(settings.theme);
    settings.language = normalizeLanguage(settings.language);
    applyAppearance(settings);
    await loadPromptPreview();
    status.value = t('settings_saved', 'Saved');
    setTimeout(() => { status.value = ''; }, 1200);
  } catch (err) {
    error.value = err.message || t('settings_save_failed', 'Save failed');
    status.value = '';
  }
}

function setTheme(value) {
  settings.theme = normalizeTheme(value);
  applyAppearance(settings);
}

function setLanguage(value) {
  settings.language = normalizeLanguage(value);
  applyAppearance(settings);
  setPageNav(t('nav_settings', 'Settings'), null, null, null);
}

onMounted(async () => {
  setPageNav(t('nav_settings', 'Settings'), null, null, null);
  await loadSettings();
  setPageNav(t('nav_settings', 'Settings'), null, null, null);
});

watch(
  () => [settings.system, settings.model, settings.compressThreshold, settings.compactPrompt, settings.maxRounds, settings.toolResultMaxChars],
  schedulePromptPreview,
);
</script>

<template>
  <section class="h-full overflow-y-auto px-6 pb-7 pt-[18px]">
    <div class="mx-auto max-w-[780px]">
      <form
        class="rounded-xl border border-[var(--line2)] bg-white p-[18px] shadow-card [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-[10px] [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-[var(--line2)] [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:px-[11px] [&_input:not([type=checkbox])]:py-2.5 [&_input:not([type=checkbox])]:text-[var(--ink)] [&_input:not([type=checkbox])]:outline-none [&_input:not([type=checkbox])]:focus:border-[var(--accent)] [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-[var(--line2)] [&_select]:bg-white [&_select]:px-[11px] [&_select]:py-2.5 [&_select]:text-[var(--ink)] [&_select]:outline-none [&_select]:focus:border-[var(--accent)] [&_textarea]:w-full [&_textarea]:min-h-[160px] [&_textarea]:resize-y [&_textarea]:rounded-[10px] [&_textarea]:border [&_textarea]:border-[var(--line2)] [&_textarea]:bg-white [&_textarea]:px-[11px] [&_textarea]:py-2.5 [&_textarea]:leading-[1.5] [&_textarea]:text-[var(--ink)] [&_textarea]:outline-none [&_textarea]:focus:border-[var(--accent)]"
        @submit.prevent="saveSettings"
      >
        <div class="mb-3 flex items-center justify-start gap-3">
          <p>{{ t('settings_desc', 'Model, prompt, appearance, and project information') }}</p>
        </div>

        <div class="mb-4 flex gap-1 border-b border-[var(--line)] [&>button]:rounded-t-lg [&>button]:px-3 [&>button]:py-[9px] [&>button]:text-[13px] [&>button]:font-semibold [&>button]:text-[var(--muted)] [&>button]:transition-colors [&>button]:hover:bg-[#f3f3f4] [&>button]:hover:text-[var(--ink2)] [&>button.active]:bg-[#eef4fe] [&>button.active]:text-[var(--accent-d)]" role="tablist" aria-label="Settings sections">
          <button type="button" :class="{ active: activeTab === 'model' }" @click="activeTab = 'model'">{{ t('settings_tab_model', 'Model') }}</button>
          <button type="button" :class="{ active: activeTab === 'prompt' }" @click="activeTab = 'prompt'">{{ t('settings_tab_prompt', 'Prompt') }}</button>
          <button type="button" :class="{ active: activeTab === 'compaction' }" @click="activeTab = 'compaction'">{{ t('settings_tab_compaction', 'Compaction') }}</button>
          <button type="button" :class="{ active: activeTab === 'tools' }" @click="activeTab = 'tools'">{{ t('settings_tab_tools', 'Tools') }}</button>
          <button type="button" :class="{ active: activeTab === 'display' }" @click="activeTab = 'display'">{{ t('settings_tab_display', 'Display') }}</button>
          <button type="button" :class="{ active: activeTab === 'about' }" @click="activeTab = 'about'">{{ t('settings_tab_about', 'About') }}</button>
        </div>

        <div v-if="error" class="mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-left text-[13px] text-[#b91c1c]">{{ error }}</div>
        <div v-if="loading" class="rounded-xl p-4 text-center text-[13px] text-[var(--muted)]">{{ t('settings_loading', 'Loading settings...') }}</div>

        <template v-else>
          <div v-if="activeTab === 'model'" class="min-w-0">
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_api_url', 'API URL') }}
              <input v-model="settings.apiUrl" class="font-mono text-xs" placeholder="https://api.openai.com/v1/chat/completions" />
            </label>
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_api_key', 'API Key') }}
              <input v-model="settings.apiKey" class="font-mono text-xs" type="password" placeholder="sk-..." />
            </label>
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_model', 'Model') }}
              <input v-model="settings.model" class="font-mono text-xs" :placeholder="t('settings_model_placeholder', 'gpt-5.2')" />
            </label>
          </div>

          <div v-else-if="activeTab === 'prompt'" class="min-w-0">
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_custom_prompt', 'Custom Prompt') }}
              <textarea v-model="settings.system" rows="8" :placeholder="t('settings_custom_prompt_placeholder', 'Optional custom system prompt')"></textarea>
            </label>
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_full_prompt', 'Full Prompt') }}
              <textarea class="font-mono text-xs min-h-[300px] bg-[#f7f7f8] text-[11.5px]" :value="promptPreview.full" rows="16" readonly></textarea>
            </label>
          </div>

          <div v-else-if="activeTab === 'compaction'" class="min-w-0">
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_compress_threshold', 'Trigger total_tokens') }}
              <input v-model="settings.compressThreshold" type="number" min="0" step="100" />
            </label>
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_compact_prompt', 'Compaction Prompt') }}
              <textarea v-model="settings.compactPrompt" rows="10" :placeholder="t('settings_compact_prompt_placeholder', 'Prompt used to compress old messages into future context')"></textarea>
            </label>
          </div>

          <div v-else-if="activeTab === 'tools'" class="min-w-0">
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_max_rounds', 'Max tool rounds') }}
              <input v-model="settings.maxRounds" type="number" min="1" max="100000" step="1" />
            </label>
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_tool_result_max_chars', 'Tool result limit') }}
              <input v-model="settings.toolResultMaxChars" type="number" min="1000" max="50000" step="1000" />
            </label>
          </div>

          <div v-else-if="activeTab === 'display'" class="min-w-0">
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_theme', 'Theme') }}
              <span class="flex rounded-[11px] border border-[var(--line2)] bg-[#f7f7f8] p-[3px] [&>button]:flex-1 [&>button]:rounded-lg [&>button]:px-3 [&>button]:py-2 [&>button]:text-[12.5px] [&>button]:font-semibold [&>button]:text-[var(--muted)] [&>button.active]:bg-white [&>button.active]:text-[var(--accent-d)] [&>button.active]:shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <button type="button" :class="{ active: settings.theme === 'light' }" @click="setTheme('light')">{{ t('settings_theme_light', 'Light') }}</button>
                <button type="button" :class="{ active: settings.theme === 'dark' }" @click="setTheme('dark')">{{ t('settings_theme_dark', 'Dark') }}</button>
              </span>
            </label>
            <label class="mb-[13px] grid gap-[7px] text-[13px] font-semibold text-[var(--ink2)]">
              {{ t('settings_language', 'Language') }}
              <span class="flex rounded-[11px] border border-[var(--line2)] bg-[#f7f7f8] p-[3px] [&>button]:flex-1 [&>button]:rounded-lg [&>button]:px-3 [&>button]:py-2 [&>button]:text-[12.5px] [&>button]:font-semibold [&>button]:text-[var(--muted)] [&>button.active]:bg-white [&>button.active]:text-[var(--accent-d)] [&>button.active]:shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                <button type="button" :class="{ active: settings.language === 'zh' }" @click="setLanguage('zh')">中文</button>
                <button type="button" :class="{ active: settings.language === 'en' }" @click="setLanguage('en')">English</button>
              </span>
            </label>
          </div>

          <div v-else class="grid gap-2.5 rounded-[10px] border border-[var(--line2)] bg-[#f7f7f8] p-3.5 [&>h3]:text-base [&>h3]:font-bold [&>p]:text-[13px] [&>p]:leading-[1.55] [&>p]:text-[var(--ink2)] [&>a]:text-[13px] [&>a]:font-semibold [&>a]:text-[var(--accent-d)]">
            <h3>{{ t('settings_about_title', 'Agent Chat') }}</h3>
            <p>{{ t('settings_about_desc', 'A local AI workspace with chat, apps, background tasks, Controls, memory, skills, and configurable model settings.') }}</p>
            <a href="https://github.com/realuckyang/AGENT" target="_blank" rel="noreferrer">{{ t('settings_about_link', 'Open source repository') }}</a>
          </div>

          <div v-if="activeTab !== 'about'" class="mt-4 flex items-center justify-end gap-3 [&>span]:flex-1 [&>span]:text-[13px] [&>span]:text-[var(--muted)]">
            <span>{{ status }}</span>
            <button class="rounded-lg border border-[var(--accent-d)] bg-[var(--accent-d)] px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-default disabled:bg-[#cfd3da]" type="submit">{{ t('settings_save', 'Save') }}</button>
          </div>
        </template>
      </form>
    </div>
  </section>
</template>
