<template>
  <div class="flex h-full min-h-0 flex-col overflow-y-auto px-3 py-3 [scrollbar-width:none]" :style="bgStyle">
    <section class="rounded-[14px] px-3.5 py-3" :style="panelStyle">
      <div class="mb-3 grid grid-cols-5 gap-1.5 rounded-[12px] bg-[rgba(120,90,40,0.08)] p-1 shadow-[inset_0_1px_3px_rgba(90,60,20,0.12)]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="h-9 rounded-[10px] text-[12px] font-bold active:translate-y-[1px]"
          :class="activeTab === tab.id ? 'text-[#3a2415]' : 'text-[#8a7356]'"
          :style="activeTab === tab.id ? activeTabStyle : null"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'model'">
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">模型设置</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">配置对话使用的大模型。</div>
        </div>

        <label class="field">
          <span>模型</span>
          <input v-model="form.model" class="text-input font-mono text-[12px]" placeholder="gpt-5.2 / deepseek-v4-pro / ..." />
        </label>

        <label class="field">
          <span>请求地址</span>
          <input v-model="form.apiUrl" class="text-input font-mono text-[12px]" placeholder="https://..." />
        </label>

        <label class="field">
          <span>API Key</span>
          <input v-model="form.apiKey" class="text-input font-mono text-[12px]" type="password" autocomplete="off" placeholder="sk-..." />
        </label>

        <label class="field">
          <span>上下文轮数</span>
          <input v-model.number="form.contextTurns" class="text-input font-mono text-[12px]" type="number" min="0" step="1" />
        </label>

        <button
          class="mt-3 w-full rounded-[11px] py-2.5 text-[13px] font-bold active:translate-y-[1px] disabled:opacity-60"
          :style="buttonStyle"
          :disabled="saving"
          @click="save"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>

        <div v-if="message" class="mt-2 text-center text-[11px]" :class="error ? 'text-[#a83a2a]' : 'text-[#4a7a3a]'">
          {{ message }}
        </div>
      </div>

      <div v-else-if="activeTab === 'prompt'">
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">提示词</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">当前发给模型的完整系统提示词。</div>
        </div>
        <pre class="prompt-box">{{ promptPreview || '加载中...' }}</pre>
      </div>

      <div v-else-if="activeTab === 'skills'">
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">技能</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">系统当前可用的能力说明。</div>
        </div>
        <div v-if="skills.length" class="space-y-2">
          <div v-for="skill in skills" :key="skill.name" class="rounded-[12px] border border-[rgba(180,150,80,0.18)] bg-[rgba(255,252,244,0.58)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <div class="text-[13px] font-bold text-[#3a2415]">{{ skill.name }}</div>
            <div class="mt-1 text-[11px] leading-[1.5] text-[#8a7356]">{{ skill.description }}</div>
          </div>
        </div>
        <div v-else class="rounded-[12px] px-3 py-8 text-center text-[12px] text-[#8a7356]">暂无技能</div>
      </div>

      <div v-else-if="activeTab === 'theme'">
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">主题</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">切换界面的明暗显示。</div>
        </div>
        <div class="grid gap-2">
          <button
            v-for="option in themeOptions"
            :key="option.id"
            class="flex items-center justify-between rounded-[12px] border px-3 py-3 text-left active:translate-y-[1px]"
            :class="theme.mode === option.id ? 'border-[rgba(200,148,28,0.45)]' : 'border-[rgba(180,150,80,0.18)]'"
            :style="theme.mode === option.id ? activeTabStyle : softPanelStyle"
            @click="theme.setMode(option.id)"
          >
            <span>
              <span class="block text-[13px] font-bold text-[#3a2415]">{{ option.label }}</span>
              <span class="mt-0.5 block text-[11px] text-[#8a7356]">{{ option.desc }}</span>
            </span>
            <span class="grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold" :style="theme.mode === option.id ? buttonStyle : mutedDotStyle">
              {{ theme.mode === option.id ? '✓' : '' }}
            </span>
          </button>
        </div>
        <div class="mt-3 rounded-[12px] border border-[rgba(180,150,80,0.18)] bg-[rgba(255,252,244,0.58)] px-3 py-2 text-[11px] leading-[1.6] text-[#7a6040]">
          当前生效: {{ resolvedThemeLabel }}
        </div>
      </div>

      <div v-else>
        <div class="mb-3">
          <div class="text-[15px] font-bold text-[#3a2415]">关于</div>
          <div class="mt-0.5 text-[11px] text-[#9a8060]">AIOS</div>
        </div>
        <div class="rounded-[12px] border border-[rgba(180,150,80,0.18)] bg-[rgba(255,252,244,0.58)] px-3 py-3 text-[12px] leading-[1.7] text-[#5f482d]">
          <div>AI 时代的操作系统。</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <a
              class="rounded-[9px] border border-[rgba(180,150,80,0.22)] bg-[rgba(255,248,232,0.72)] px-2.5 py-1.5 text-[11px] font-bold text-[#7a5315] active:translate-y-[1px]"
              href="https://github.com/realuckyang/AIOS"
              target="_blank"
              rel="noreferrer"
            >
              开源仓库
            </a>
            <a
              class="rounded-[9px] border border-[rgba(180,150,80,0.22)] bg-[rgba(255,248,232,0.72)] px-2.5 py-1.5 text-[11px] font-bold text-[#7a5315] active:translate-y-[1px]"
              href="https://iimos.ai"
              target="_blank"
              rel="noreferrer"
            >
              官网 iimos.ai
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useThemeStore } from '../../stores/theme.js';

const saving = ref(false);
const message = ref('');
const error = ref(false);
const activeTab = ref('model');
const promptPreview = ref('');
const skills = ref([]);
const theme = useThemeStore();
const tabs = [
  { id: 'model', label: '模型' },
  { id: 'prompt', label: '提示词' },
  { id: 'skills', label: '技能' },
  { id: 'theme', label: '主题' },
  { id: 'about', label: '关于' },
];
const themeOptions = [
  { id: 'system', label: '跟随系统', desc: '根据设备明暗偏好自动切换' },
  { id: 'light', label: '明亮', desc: '羊皮纸与黄铜质感' },
  { id: 'dark', label: '暗色', desc: '深色木纹与暖金高光' },
];
const form = reactive({
  model: '',
  apiUrl: '',
  apiKey: '',
  contextTurns: 100,
});

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const resolvedThemeLabel = computed(() => theme.resolved === 'dark' ? '暗色' : '明亮');

const load = async () => {
  const settingsData = await request('/api/settings');
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
    await request('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: form.model,
        apiUrl: form.apiUrl,
        apiKey: form.apiKey,
        contextTurns: form.contextTurns,
      }),
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

const bgStyle = {
  background: 'linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)',
};
const panelStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)',
  boxShadow: '0 2px 8px rgba(90,60,20,0.1),inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(180,150,80,0.18)',
};
const buttonStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 3px 0 #6a4800,0 4px 10px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,215,80,0.35)',
  color: 'rgba(255,245,190,0.95)',
};
const activeTabStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#e7d8b8 100%)',
  boxShadow: '0 2px 6px rgba(90,60,20,0.16),inset 0 1px 0 rgba(255,255,255,0.85)',
};
const softPanelStyle = {
  background: 'rgba(255,252,244,0.58)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
};
const mutedDotStyle = {
  background: 'rgba(120,90,40,0.12)',
  color: '#8a7356',
};
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.field span {
  font-size: 11px;
  font-weight: 700;
  color: #7a6040;
}
.prompt-box {
  min-height: 360px;
  max-height: calc(100dvh - 180px);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 12px;
  border: 1px solid rgba(180,150,80,0.18);
  background: rgba(255,252,244,0.62);
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.55;
  color: #4a321c;
  box-shadow: inset 0 1px 4px rgba(90,60,20,0.08);
}
</style>
