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
  { id: 'model', label: '模型' },
  { id: 'prompt', label: '提示词' },
  { id: 'skills', label: '技能' },
  { id: 'theme', label: '主题' },
  { id: 'about', label: '关于' },
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
    message.value = '已保存';
    await load();
  } catch (err) {
    error.value = true;
    message.value = err.message || '保存失败';
  } finally {
    saving.value = false;
  }
};

onMounted(load);
</script>
