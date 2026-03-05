<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-5">
        <h1 class="m-0 text-xl font-bold text-[#4a3a28]">{{ t('tasks_create_title') }}</h1>
        <p class="mt-0.5 text-xs text-[#a0907a]">{{ t('tasks_create_subtitle') }}</p>
      </div>

      <div v-if="error" class="mb-4 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div class="space-y-4">
          <!-- 执行方式 -->
          <div>
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">{{ t('tasks_exec_type') }}</label>
            <div class="flex gap-2">
              <button
                v-for="tp in execTypes"
                :key="tp.value"
                type="button"
                class="cursor-pointer rounded-lg border px-4 py-1.5 text-xs transition"
                :class="form.execType === tp.value
                  ? 'border-[#c8a060] bg-[#f8f0e0] font-semibold text-[#7a5a28]'
                  : 'border-[#e8dcc8] bg-[#fcfaf6] text-[#7a6a58] hover:bg-[#f6ecde]'"
                @click="form.execType = tp.value"
              >
                {{ tp.label }}
              </button>
            </div>
          </div>

          <!-- 名称（定时任务需要） -->
          <div v-if="form.execType !== 'now'">
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">{{ t('tasks_task_name') }}</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="每日简报"
              class="w-full rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 text-[13px] text-[#4a3a28] outline-none transition focus:border-[#c8a060]"
            >
          </div>

          <!-- 立即执行：标题 -->
          <div v-if="form.execType === 'now'">
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">{{ t('tasks_task_title') }}</label>
            <input
              v-model="form.title"
              type="text"
              placeholder="提取摘要"
              class="w-full rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 text-[13px] text-[#4a3a28] outline-none transition focus:border-[#c8a060]"
            >
          </div>

          <!-- 提示词 -->
          <div>
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">{{ t('tasks_prompt') }}</label>
            <textarea
              v-model="form.prompt"
              rows="6"
              :placeholder="t('tasks_prompt_placeholder')"
              class="w-full resize-y rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 text-[13px] leading-relaxed text-[#4a3a28] outline-none transition focus:border-[#c8a060]"
            />
          </div>

          <!-- 定时：执行时间 -->
          <div v-if="form.execType === 'once'">
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">{{ t('tasks_exec_time') }}</label>
            <input
              v-model="form.runAt"
              type="datetime-local"
              class="w-full rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 text-[13px] text-[#4a3a28] outline-none transition focus:border-[#c8a060]"
            >
          </div>

          <!-- 循环：cron -->
          <div v-if="form.execType === 'repeat'">
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">{{ t('tasks_cron_expr') }}</label>
            <input
              v-model="form.cron"
              type="text"
              placeholder="0 8 * * *"
              class="w-full rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 font-mono text-[13px] text-[#4a3a28] outline-none transition focus:border-[#c8a060]"
            >
            <div class="mt-1 text-[10px] text-[#a0907a]">
              {{ t('tasks_cron_help') }} &nbsp;|&nbsp; 例：<span class="font-mono">0 8 * * *</span> {{ t('tasks_cron_example_daily') }}，<span class="font-mono">*/5 * * * *</span> {{ t('tasks_cron_example_interval') }}
            </div>
          </div>

          <!-- 按钮 -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-4 py-2 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]"
              @click="$router.push('/tasks')"
            >
              {{ t('tasks_cancel') }}
            </button>
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-[#c8a060] bg-[#f8f0e0] px-5 py-2 text-xs font-semibold text-[#7a5a28] transition hover:bg-[#f0e4c8] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="submitting"
              @click="submit"
            >
              {{ submitting ? t('tasks_submitting') : submitLabel }}
            </button>
          </div>
        </div>
      </div>

      <!-- 立即执行结果 -->
      <div v-if="result" class="mt-4 rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div class="mb-2 flex items-center gap-2">
          <span class="text-sm font-bold text-[#4a8a38]">{{ result.scheduled ? t('tasks_scheduled') : t('tasks_done') }}</span>
          <span class="rounded bg-[#f0e5d5] px-2 py-0.5 text-[10px] text-[#7a6a58]">#{{ result.id }}</span>
        </div>
        <div v-if="result.response" class="whitespace-pre-wrap rounded-lg bg-[#eef7ea] px-3 py-2 text-[13px] leading-relaxed text-[#2d4a30]">{{ result.response }}</div>
        <div v-if="result.scheduled" class="text-[13px] text-[#4a8a38]">{{ t('tasks_queued') }}</div>
        <button
          v-if="result.taskId"
          type="button"
          class="mt-3 cursor-pointer text-xs text-[#7a6a58] underline transition hover:text-[#4a3a28]"
          @click="$router.push(`/task/${result.taskId}`)"
        >
          {{ t('tasks_view_detail') }}
        </button>
        <button
          v-if="result.scheduled"
          type="button"
          class="mt-3 cursor-pointer text-xs text-[#7a6a58] underline transition hover:text-[#4a3a28]"
          @click="$router.push('/tasks')"
        >
          {{ t('tasks_view_schedules') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useI18n } from '../i18n/index.js';

const { t } = useI18n();

const execTypes = computed(() => [
  { value: 'now', label: t('tasks_exec_now') },
  { value: 'once', label: t('tasks_exec_once') },
  { value: 'repeat', label: t('tasks_exec_repeat') }
]);

const form = reactive({
  execType: 'now',
  name: '',
  title: '',
  prompt: '',
  runAt: '',
  cron: ''
});

const error = ref('');
const submitting = ref(false);
const result = ref(null);

const submitLabel = computed(() => {
  if (form.execType === 'now') return t('tasks_submit_now');
  if (form.execType === 'once') return t('tasks_submit_once');
  return t('tasks_submit_repeat');
});

const submit = async () => {
  error.value = '';
  result.value = null;

  if (!form.prompt.trim()) { error.value = t('tasks_fill_prompt'); return; }

  if (form.execType === 'now') {
    return submitNow();
  }

  if (!form.name.trim()) { error.value = t('tasks_fill_name'); return; }
  if (form.execType === 'once' && !form.runAt) { error.value = t('tasks_fill_time'); return; }
  if (form.execType === 'repeat' && !form.cron.trim()) { error.value = t('tasks_fill_cron'); return; }
  return submitSchedule();
};

const submitNow = async () => {
  submitting.value = true;
  try {
    const body = { app: 'task', title: form.title.trim() || '任务', prompt: form.prompt.trim() };
    const res = await fetch('/api/task/create/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    result.value = { id: data.id, taskId: data.id, response: data.response };
  } catch (e) {
    error.value = e.message || t('tasks_submit_fail');
  } finally {
    submitting.value = false;
  }
};

const submitSchedule = async () => {
  submitting.value = true;
  try {
    const body = { name: form.name.trim(), prompt: form.prompt.trim() };
    if (form.execType === 'once') {
      body.run_at = form.runAt.replace('T', ' ');
    } else {
      body.cron = form.cron.trim();
    }
    const res = await fetch('/api/schedule/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
    result.value = { id: data.id, scheduled: true };
  } catch (e) {
    error.value = e.message || t('tasks_submit_fail');
  } finally {
    submitting.value = false;
  }
};
</script>
