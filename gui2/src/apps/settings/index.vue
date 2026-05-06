<script setup>
import { onActivated, onMounted, ref } from 'vue';
import * as api from '@/lib/api.js';
import { useAuthStore } from '@/stores/auth.js';

const auth = useAuthStore();

const settings = ref(null);
const prompt = ref('');
const loading = ref(false);
const saving = ref(false);
const errMsg = ref('');
const okMsg = ref('');
const tab = ref('model');

const oldPwd = ref('');
const newPwd = ref('');
const newPwd2 = ref('');
const pwdMsg = ref('');

async function load() {
  loading.value = true; errMsg.value = '';
  try {
    settings.value = await api.get('/api/settings');
    const p = await api.get('/api/settings/prompt');
    prompt.value = p?.content || '';
  } catch (e) { errMsg.value = '加载失败: ' + (e.message || e); }
  loading.value = false;
}

async function saveModel() {
  saving.value = true; errMsg.value = ''; okMsg.value = '';
  try {
    settings.value = await api.post('/api/settings', {
      provider: settings.value.provider,
      apiUrl:   settings.value.apiUrl,
      apiKey:   settings.value.apiKey,
      model:    settings.value.model,
      contextRounds: settings.value.contextRounds,
      enableToolLoopLimit: settings.value.enableToolLoopLimit ? '1' : '0',
      toolMaxRounds: settings.value.toolMaxRounds
    });
    okMsg.value = '已保存';
    setTimeout(() => okMsg.value = '', 1800);
  } catch (e) { errMsg.value = '保存失败: ' + (e.message || e); }
  saving.value = false;
}
async function savePrompt() {
  saving.value = true; errMsg.value = ''; okMsg.value = '';
  try {
    await api.post('/api/settings/prompt', { content: prompt.value });
    okMsg.value = '系统提示词已保存';
    setTimeout(() => okMsg.value = '', 1800);
  } catch (e) { errMsg.value = '保存失败: ' + (e?.body?.message || e.message || e); }
  saving.value = false;
}
async function changePwd() {
  pwdMsg.value = '';
  if (!oldPwd.value || !newPwd.value) { pwdMsg.value = '请填写完整'; return; }
  if (newPwd.value !== newPwd2.value) { pwdMsg.value = '两次新密码不一致'; return; }
  try {
    await api.post('/api/auth/change-password', { oldPassword: oldPwd.value, newPassword: newPwd.value });
    pwdMsg.value = '密码已更新';
    oldPwd.value = newPwd.value = newPwd2.value = '';
  } catch (e) { pwdMsg.value = '失败: ' + (e?.body?.message || e.message || e); }
}

onMounted(load);
onActivated(load);
</script>

<template>
  <section class="page">
    <header class="hd">
      <div class="h1">设置</div>
      <div class="tabs">
        <button :class="{ active: tab === 'model' }" @click="tab = 'model'">模型 / API</button>
        <button :class="{ active: tab === 'prompt' }" @click="tab = 'prompt'">系统提示词</button>
        <button :class="{ active: tab === 'account' }" @click="tab = 'account'">账户</button>
      </div>
    </header>

    <div v-if="errMsg" class="err">{{ errMsg }}</div>
    <div v-if="okMsg" class="ok">{{ okMsg }}</div>
    <div v-if="loading || !settings" class="placeholder">加载中...</div>

    <template v-if="settings">
      <!-- 模型 / API -->
      <div v-show="tab === 'model'" class="form">
        <label class="field">
          <span class="lbl">Provider</span>
          <select class="text-input" v-model="settings.provider">
            <option value="openai">openai</option>
            <option value="anthropic">anthropic</option>
            <option value="ollama">ollama</option>
          </select>
        </label>
        <label class="field">
          <span class="lbl">API URL</span>
          <input class="text-input" v-model="settings.apiUrl" />
        </label>
        <label class="field">
          <span class="lbl">API Key</span>
          <input class="text-input" type="password" v-model="settings.apiKey" placeholder="sk-..." />
        </label>
        <label class="field">
          <span class="lbl">Model</span>
          <input class="text-input" v-model="settings.model" />
        </label>
        <label class="field">
          <span class="lbl">上下文轮数</span>
          <select class="text-input" v-model.number="settings.contextRounds">
            <option :value="30">30</option>
            <option :value="100">100</option>
            <option :value="500">500</option>
          </select>
        </label>
        <label class="field check">
          <input type="checkbox" v-model="settings.enableToolLoopLimit" />
          <span>启用工具调用轮数限制</span>
        </label>
        <label v-if="settings.enableToolLoopLimit" class="field">
          <span class="lbl">最大工具调用轮数</span>
          <input class="text-input" type="number" min="1" max="500" v-model.number="settings.toolMaxRounds" />
        </label>
        <div class="actions">
          <button class="pill-btn solid" :disabled="saving" @click="saveModel">{{ saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>

      <!-- 系统提示词 -->
      <div v-show="tab === 'prompt'" class="form">
        <label class="field">
          <span class="lbl">系统提示词 (System Prompt)</span>
          <textarea class="text-input" rows="18" style="font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; font-size: 12.5px;" v-model="prompt"></textarea>
        </label>
        <div class="actions">
          <button class="pill-btn solid" :disabled="saving" @click="savePrompt">{{ saving ? '保存中...' : '保存提示词' }}</button>
        </div>
      </div>

      <!-- 账户 -->
      <div v-show="tab === 'account'" class="form">
        <p class="tip">忘记密码可在终端执行: <code>sqlite3 database/aios.db "DELETE FROM auth; DELETE FROM sessions;"</code></p>
        <label class="field">
          <span class="lbl">当前密码</span>
          <input class="text-input" type="password" v-model="oldPwd" />
        </label>
        <label class="field">
          <span class="lbl">新密码</span>
          <input class="text-input" type="password" v-model="newPwd" />
        </label>
        <label class="field">
          <span class="lbl">确认新密码</span>
          <input class="text-input" type="password" v-model="newPwd2" />
        </label>
        <div v-if="pwdMsg" class="msg">{{ pwdMsg }}</div>
        <div class="actions">
          <button class="pill-btn solid" @click="changePwd">修改密码</button>
          <button class="pill-btn" @click="auth.logout()">退出登录</button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.page { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; padding: 20px 24px 32px; }
.hd { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.h1 { font-size: 22px; font-weight: 500; letter-spacing: -0.01em; }
.tabs { display: flex; gap: 4px; margin-left: auto; }
.tabs button { background: transparent; border: 0; padding: 8px 14px; border-radius: 18px; color: var(--text-2); font-size: 13.5px; }
.tabs button:hover { background: var(--bg-hover); color: var(--text); }
.tabs button.active { background: var(--accent-soft); color: var(--accent-fg); }

.err { padding: 8px 12px; background: #fce8e6; color: var(--bad); border-radius: 8px; font-size: 12.5px; margin-bottom: 12px; max-width: 640px; }
.ok { padding: 8px 12px; background: #e6f4ea; color: var(--good); border-radius: 8px; font-size: 12.5px; margin-bottom: 12px; max-width: 640px; }
.placeholder { color: var(--text-3); padding: 40px; text-align: center; }

.form { max-width: 640px; display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field.check { flex-direction: row; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); }
.lbl { font-size: 12.5px; color: var(--text-2); }
.actions { display: flex; gap: 8px; padding-top: 4px; }
.tip { font-size: 12.5px; color: var(--text-3); margin: 0 0 6px; }
.tip code { font-family: 'JetBrains Mono', ui-monospace, Menlo, monospace; background: var(--bg-elev); padding: 1px 6px; border-radius: 4px; font-size: 12px; }
.msg { font-size: 12.5px; color: var(--text-2); }
</style>
