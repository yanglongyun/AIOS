<template>
  <div class="absolute inset-0 overflow-y-auto dot-grid">
    <MainView
      v-model:active-tab="activeTab"
      :tabs="tabs"
      :form="form"
      :saving="saving"
      :message="message"
      :error="error"
      :prompt-preview="promptPreview"
      :skills="skills"
      @save="save"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import MainView from './views/MainView.vue';
import { loadSettings, saveSettings } from './lib/api.js';

const saving = ref(false);
const message = ref('');
const error = ref(false);
const activeTab = ref('model');
const promptPreview = ref('');
const skills = ref([]);
const tabs = [
  { id: 'model', label: '__T_SETTINGS_MODEL__' },
  { id: 'prompt', label: '__T_SETTINGS_TAB_PROMPT__' },
  { id: 'skills', label: '__T_SETTINGS_TAB_SKILLS__' },
  { id: 'theme', label: '__T_SETTINGS_THEME_TITLE__' },
  { id: 'about', label: '__T_SETTINGS_TAB_ABOUT__' },
];
const form = reactive({
  model: '',
  apiUrl: '',
  apiKey: '',
  contextTurns: 100,
});

const load = async () => {
  const settingsData = await loadSettings();
  const settings = settingsData.settings || {};
  form.model = settings.model || '';
  form.apiUrl = settings.apiUrl || '';
  form.apiKey = settings.apiKey || '';
  form.contextTurns = Number.isFinite(Number(settings.contextTurns)) ? Number(settings.contextTurns) : 100;
  promptPreview.value = settingsData.promptPreview || '';
  skills.value = settingsData.skills || [];
};

const save = async () => {
  saving.value = true;
  message.value = '';
  error.value = false;
  try {
    await saveSettings({
      model: form.model,
      apiUrl: form.apiUrl,
      apiKey: form.apiKey,
      contextTurns: form.contextTurns,
    });
    message.value = '__T_SETTINGS_SAVED__';
    await load();
  } catch (err) {
    error.value = true;
    message.value = err.message || '__T_SETTINGS_SAVE_FAILED__';
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>
