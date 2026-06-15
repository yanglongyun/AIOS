<template>
  <div class="page">
    <div class="h-row"><h2>__T_APP_NAME_SETTINGS__</h2></div>

    <TabBar v-model:active="activeTab" :tabs="tabs" />

    <div class="card">
      <div v-if="activeTab === 'model'">
        <Field label="__T_SETTINGS_MODEL__" hint="__T_SETTINGS_MODEL_FIELD_HINT__">
          <input v-model="form.model" placeholder="gpt-5.2 / deepseek-v4-pro / ..." />
        </Field>
        <Field label="__T_SETTINGS_API_URL__">
          <input v-model="form.apiUrl" placeholder="https://..." />
        </Field>
        <Field label="API Key">
          <input v-model="form.apiKey" type="password" autocomplete="off" placeholder="sk-..." />
        </Field>
        <Field label="__T_SETTINGS_TOOL_RESULT_MAX_CHARS__">
          <input v-model.number="form.toolResultMaxChars" type="number" min="1000" max="50000" step="1000" />
        </Field>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:18px">
          <span v-if="message" style="font-size:11.5px" :style="{ color: error ? 'var(--color-bad)' : 'var(--color-good)' }">
            {{ message }}
          </span>
          <button class="blue-btn" :disabled="saving" @click="$emit('save')">
            {{ saving ? '__T_SETTINGS_SAVING__' : '__T_COMMON_SAVE__' }}
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'prompt'">
        <Field label="__T_SETTINGS_TAB_PROMPT__" hint="__T_SETTINGS_PROMPT_HINT__">
          <pre class="prompt-box">{{ promptPreview || '__T_COMMON_LOADING__' }}</pre>
        </Field>
      </div>

      <div v-else-if="activeTab === 'compaction'">
        <Field label="__T_SETTINGS_COMPRESS_THRESHOLD__">
          <input v-model.number="form.compressThreshold" type="number" min="0" step="100" />
        </Field>
        <Field label="__T_SETTINGS_COMPACT_PROMPT__">
          <textarea v-model="form.compactPrompt" rows="8" placeholder="你负责压缩聊天上下文..."></textarea>
        </Field>
      </div>

      <div v-else-if="activeTab === 'skills'">
        <Field label="__T_SETTINGS_TAB_SKILLS__" hint="__T_SETTINGS_SKILLS_HINT__">
          <template v-if="skills.length">
            <div v-for="skill in skills" :key="skill.name" class="opt">
              <span class="opt-main">
                <span class="opt-title">{{ skill.name }}</span>
                <span class="opt-desc">{{ skill.description }}</span>
              </span>
            </div>
          </template>
          <div v-else class="opt"><span class="opt-main"><span class="opt-desc">__T_SETTINGS_SKILLS_EMPTY__</span></span></div>
        </Field>
      </div>

      <div v-else-if="activeTab === 'theme'">
        <Field label="__T_SETTINGS_THEME_TITLE__" :hint="`__T_SETTINGS_THEME_ACTIVE__`.replace('{t}', resolvedThemeLabel)">
          <button
            v-for="option in themeOptions"
            :key="option.id"
            class="opt"
            :class="{ on: theme.mode === option.id }"
            @click="theme.setMode(option.id)"
          >
            <span class="opt-main">
              <span class="opt-title">{{ option.label }}</span>
              <span class="opt-desc">{{ option.desc }}</span>
            </span>
            <span class="opt-check">{{ theme.mode === option.id ? '✓' : '' }}</span>
          </button>
        </Field>
      </div>

      <div v-else>
        <Field label="__T_SETTINGS_TAB_ABOUT__">
          <div class="opt">
            <span class="opt-main">
              <span class="opt-title">AIOS</span>
              <span class="opt-desc">__T_SETTINGS_ABOUT_DESC__</span>
              <span class="about-links">
                <a href="https://github.com/realuckyang/AIOS" target="_blank" rel="noreferrer">__T_SETTINGS_ABOUT_REPO__</a>
                <a href="https://iimos.ai" target="_blank" rel="noreferrer">__T_SETTINGS_ABOUT_SITE__</a>
              </span>
            </span>
          </div>
        </Field>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useThemeStore } from '../../../stores/theme.js';
import TabBar from '../components/TabBar.vue';
import Field from '../components/Field.vue';

defineProps({
  tabs: { type: Array, default: () => [] },
  form: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  message: { type: String, default: '' },
  error: { type: Boolean, default: false },
  promptPreview: { type: String, default: '' },
  skills: { type: Array, default: () => [] },
});
defineEmits(['save']);
const activeTab = defineModel('activeTab', { type: String, default: 'model' });

const theme = useThemeStore();
const themeOptions = [
  { id: 'system', label: '__T_SETTINGS_THEME_SYSTEM__', desc: '__T_SETTINGS_THEME_SYSTEM_DESC__' },
  { id: 'light', label: '__T_SETTINGS_THEME_LIGHT__', desc: '__T_SETTINGS_THEME_LIGHT_DESC__' },
  { id: 'dark', label: '__T_SETTINGS_THEME_DARK__', desc: '__T_SETTINGS_THEME_DARK_DESC__' },
];
const resolvedThemeLabel = computed(() => theme.resolved === 'dark' ? '__T_SETTINGS_THEME_DARK__' : '__T_SETTINGS_THEME_LIGHT__');
</script>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 26px 24px 50px;
}
.h-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.h-row h2 {
  font-size: 17px;
  font-weight: 700;
  flex: 1;
  color: var(--color-ink);
}
.card {
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 18px 20px;
}
.blue-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 9px;
  background: var(--color-accent);
  color: #fff;
  font: inherit;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}
.blue-btn:hover:not(:disabled) { background: var(--color-accent-hi); }
.blue-btn:disabled { opacity: 0.6; cursor: default; }
.opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #dededf;
  border-radius: 9px;
  background: var(--color-bg-elev);
  font: inherit;
  text-align: left;
  transition: border-color 0.12s;
}
.opt + .opt { margin-top: 8px; }
button.opt { cursor: pointer; }
button.opt:hover { background: #f7f7f8; }
.opt.on {
  border-color: rgba(98, 165, 244, 0.45);
  box-shadow: 0 0 0 1px rgba(98, 165, 244, 0.45);
}
.opt-main { min-width: 0; flex: 1; }
.opt-title {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--color-ink);
}
.opt-desc {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--color-muted);
}
.opt-check {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-accent);
}
.about-links {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}
.about-links a {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
}
.about-links a:hover { color: var(--color-accent-hi); }
.prompt-box {
  min-height: 360px;
  max-height: calc(100dvh - 240px);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid #dededf;
  border-radius: 9px;
  background: #f7f7f8;
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.55;
  color: var(--color-ink);
}
</style>
