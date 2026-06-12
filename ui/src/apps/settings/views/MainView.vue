<template>
  <div class="page">
    <div class="h-row"><h2>设置</h2></div>

    <TabBar v-model:active="activeTab" :tabs="tabs" />

    <div class="card">
      <div v-if="activeTab === 'model'">
        <Field label="模型" hint="对话与任务默认使用的大模型。">
          <input v-model="form.model" placeholder="gpt-5.2 / deepseek-v4-pro / ..." />
        </Field>
        <Field label="API 地址">
          <input v-model="form.apiUrl" placeholder="https://..." />
        </Field>
        <Field label="API Key">
          <input v-model="form.apiKey" type="password" autocomplete="off" placeholder="sk-..." />
        </Field>
        <Field label="上下文轮数">
          <input v-model.number="form.contextTurns" type="number" min="0" step="1" />
        </Field>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-top:18px">
          <span v-if="message" style="font-size:11.5px" :style="{ color: error ? 'var(--color-bad)' : 'var(--color-good)' }">
            {{ message }}
          </span>
          <button class="blue-btn" :disabled="saving" @click="$emit('save')">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>

      <div v-else-if="activeTab === 'prompt'">
        <Field label="提示词" hint="当前发给模型的完整系统提示词。">
          <pre class="prompt-box">{{ promptPreview || '加载中...' }}</pre>
        </Field>
      </div>

      <div v-else-if="activeTab === 'skills'">
        <Field label="技能" hint="系统当前可用的能力说明。">
          <template v-if="skills.length">
            <div v-for="skill in skills" :key="skill.name" class="opt">
              <span class="opt-main">
                <span class="opt-title">{{ skill.name }}</span>
                <span class="opt-desc">{{ skill.description }}</span>
              </span>
            </div>
          </template>
          <div v-else class="opt"><span class="opt-main"><span class="opt-desc">暂无技能</span></span></div>
        </Field>
      </div>

      <div v-else-if="activeTab === 'theme'">
        <Field label="主题" :hint="`当前生效: ${resolvedThemeLabel}`">
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
        <Field label="关于">
          <div class="opt">
            <span class="opt-main">
              <span class="opt-title">AIOS</span>
              <span class="opt-desc">AI 时代的操作系统。</span>
              <span class="about-links">
                <a href="https://github.com/realuckyang/AIOS" target="_blank" rel="noreferrer">开源仓库</a>
                <a href="https://iimos.ai" target="_blank" rel="noreferrer">官网 iimos.ai</a>
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
  { id: 'system', label: '跟随系统', desc: '根据设备明暗偏好自动切换' },
  { id: 'light', label: '明亮', desc: '暖白平面风格' },
  { id: 'dark', label: '暗色', desc: '深色平面风格' },
];
const resolvedThemeLabel = computed(() => theme.resolved === 'dark' ? '暗色' : '明亮');
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
