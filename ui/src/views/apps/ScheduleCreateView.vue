<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[640px]">

      <!-- Header -->
      <div class="mb-6 flex items-center gap-3">
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8cebb] bg-white text-sm text-[#7a6a54] hover:bg-[#f0e8d8] transition"
          @click="goSchedule"
        >←</button>
        <div>
          <h1 class="text-xl font-bold text-[#3a2e20]">{{ isEdit ? t('schedule_edit_title') : t('schedule_create_title') }}</h1>
          <p class="text-xs text-[#9a8a74]">{{ t('schedule_create_subtitle') }}</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-4 py-2.5 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="space-y-4">

        <!-- 1. 执行方式 -->
        <div class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">{{ t('schedule_exec_type') }}</div>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="tp in execTypes"
              :key="tp.value"
              type="button"
              class="rounded-xl border-2 p-4 text-left transition"
              :class="form.execType === tp.value
                ? 'border-[#b08040] bg-[#fdf6e8]'
                : 'border-[#e4d8c4] bg-white hover:border-[#c8b898] hover:bg-[#faf7f2]'"
              @click="form.execType = tp.value"
            >
              <div class="mb-1.5 text-xl">{{ tp.icon }}</div>
              <div class="font-semibold text-[#3a2e20]">{{ tp.label }}</div>
              <div class="mt-1 text-[11px] leading-relaxed text-[#9a8a74]">{{ tp.desc }}</div>
            </button>
          </div>
        </div>

        <!-- 2. 基本信息 -->
        <div class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">{{ t('schedule_section_basic') }}</div>
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[#5a4a38]">{{ t('schedule_name') }}</label>
              <input
                v-model="form.name"
                type="text"
                :placeholder="t('schedule_name_placeholder')"
                class="w-full rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:bg-white focus:ring-2 focus:ring-[#b0804020]"
              >
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[#5a4a38]">{{ t('schedule_prompt') }}</label>
              <textarea
                v-model="form.prompt"
                rows="5"
                :placeholder="t('schedule_prompt_placeholder')"
                class="w-full resize-y rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 text-sm leading-relaxed text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:bg-white focus:ring-2 focus:ring-[#b0804020]"
              />
              <p class="mt-1.5 text-[11px] text-[#9a8a74]">{{ t('schedule_prompt_hint') }}</p>
            </div>
          </div>
        </div>

        <!-- 3a. 执行时间（定时模式） -->
        <div v-if="form.execType === 'once'" class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">{{ t('schedule_section_time') }}</div>
          <input
            v-model="form.runAt"
            type="datetime-local"
            class="w-full rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:ring-2 focus:ring-[#b0804020] [color-scheme:light]"
          >
          <p class="mt-1.5 text-[11px] text-[#9a8a74]">{{ t('schedule_exec_time_hint') }}</p>
        </div>

        <!-- 3b. Cron 规则（循环模式） -->
        <div v-if="form.execType === 'repeat'" class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">{{ t('schedule_section_rule') }}</div>

          <!-- 快捷预设 -->
          <div class="mb-4 grid grid-cols-3 gap-2">
            <button
              v-for="preset in cronPresets"
              :key="preset.cron"
              type="button"
              class="rounded-lg border px-3 py-2 text-center transition"
              :class="form.cron === preset.cron
                ? 'border-2 border-[#b08040] bg-[#fdf6e8]'
                : 'border-[#e4d8c4] hover:border-[#c8a870] hover:bg-[#f0e8d8]'"
              @click="form.cron = preset.cron"
            >
              <div class="text-xs font-semibold text-[#4a3a28]">{{ preset.label }}</div>
              <div class="font-mono text-[10px] text-[#9a8a74]">{{ preset.cron }}</div>
            </button>
          </div>

          <label class="mb-1.5 block text-sm font-medium text-[#5a4a38]">{{ t('schedule_cron_custom') }}</label>
          <input
            v-model="form.cron"
            type="text"
            placeholder="0 8 * * *"
            class="w-full rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 font-mono text-sm text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:ring-2 focus:ring-[#b0804020]"
          >
          <div class="mt-2 flex items-center gap-3 text-[11px] text-[#9a8a74]">
            <span>{{ t('schedule_cron_help') }}</span>
            <span v-if="cronDescription" class="rounded-full bg-[#e8f0e0] px-2 py-0.5 font-medium text-[#4a7a38]">{{ cronDescription }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            class="rounded-xl border border-[#d8cebb] bg-white px-5 py-2.5 text-sm text-[#7a6a54] hover:bg-[#f0e8d8] transition"
            @click="goSchedule"
          >
            {{ t('schedule_cancel') }}
          </button>
          <button
            type="button"
            class="rounded-xl bg-[#4a3520] px-6 py-2.5 text-sm font-semibold text-[#f0e4cc] shadow-sm hover:bg-[#5a4530] transition disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting"
            @click="submit"
          >
            {{ submitting ? t('schedule_submitting') : submitLabel }}
          </button>
        </div>

        <!-- 结果 -->
        <div v-if="result" class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-2 flex items-center gap-2">
            <span class="text-sm font-bold text-[#4a8a38]">{{ result.scheduled ? t('schedule_scheduled') : t('schedule_done') }}</span>
            <span class="rounded bg-[#f0e5d5] px-2 py-0.5 text-[10px] text-[#7a6a58]">#{{ result.id }}</span>
          </div>
          <div v-if="result.response" class="whitespace-pre-wrap rounded-lg bg-[#eef7ea] px-3 py-2 text-[13px] leading-relaxed text-[#2d4a30]">{{ result.response }}</div>
          <div v-if="result.scheduled" class="text-[13px] text-[#4a8a38]">{{ t('schedule_queued') }}</div>
          <button
            v-if="result.taskId"
            type="button"
            class="mt-3 text-xs text-[#7a6a58] underline underline-offset-2 hover:text-[#4a3a28] transition"
            @click="$router.push(`/task/${result.taskId}`)"
          >{{ t('schedule_view_detail') }}</button>
          <button
            v-if="result.scheduled"
            type="button"
            class="mt-3 text-xs text-[#7a6a58] underline underline-offset-2 hover:text-[#4a3a28] transition"
            @click="goSchedule"
          >{{ t('schedule_view_list') }}</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from '../../i18n/index.js';
import { useRoute, useRouter } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const execTypes = computed(() => [
  { value: 'once', icon: '📅', label: t('schedule_exec_once'), desc: t('schedule_exec_once_desc') },
  { value: 'repeat', icon: '🔄', label: t('schedule_exec_repeat'), desc: t('schedule_exec_repeat_desc') }
]);

const cronPresets = computed(() => [
  { label: t('schedule_preset_daily'), cron: '0 8 * * *' },
  { label: t('schedule_preset_weekly'), cron: '0 9 * * 1' },
  { label: t('schedule_preset_monthly'), cron: '0 8 1 * *' },
  { label: t('schedule_preset_hourly'), cron: '0 * * * *' },
  { label: t('schedule_preset_5min'), cron: '*/5 * * * *' },
  { label: t('schedule_preset_weekday'), cron: '0 9 * * 1-5' }
]);

const form = reactive({
  execType: 'once',
  name: '',
  prompt: '',
  runAt: '',
  cron: ''
});

const error = ref('');
const submitting = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const result = ref(null);

const submitLabel = computed(() => {
  if (form.execType === 'once') return t('schedule_submit_once');
  return t('schedule_submit_repeat');
});

const cronDescription = computed(() => {
  const map = {
    '0 8 * * *': t('schedule_cron_example_daily'),
    '0 9 * * 1': t('schedule_preset_weekly'),
    '0 8 1 * *': t('schedule_preset_monthly'),
    '0 * * * *': t('schedule_preset_hourly'),
    '*/5 * * * *': t('schedule_preset_5min'),
    '0 9 * * 1-5': t('schedule_preset_weekday')
  };
  return map[form.cron.trim()] || '';
});

const submit = async () => {
  error.value = '';
  result.value = null;

  if (!form.prompt.trim()) { error.value = t('schedule_fill_prompt'); return; }
  if (!form.name.trim()) { error.value = t('schedule_fill_name'); return; }
  if (form.execType === 'once' && !form.runAt) { error.value = t('schedule_fill_time'); return; }
  if (form.execType === 'repeat' && !form.cron.trim()) { error.value = t('schedule_fill_cron'); return; }
  return submitSchedule();
};

const submitSchedule = async () => {
  submitting.value = true;
  try {
    const apiUrl = isEdit.value ? '/api/schedule/update' : '/api/schedule/create';
    const reqBody = isEdit.value
      ? { id: editId.value, name: form.name.trim(), prompt: form.prompt.trim() }
      : { name: form.name.trim(), prompt: form.prompt.trim() };
    if (form.execType === 'once') {
      reqBody.run_at = form.runAt.replace('T', ' ');
      reqBody.cron = null;
    } else {
      reqBody.cron = form.cron.trim();
      reqBody.run_at = null;
    }
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
    result.value = { id: data.id, scheduled: true };
  } catch (e) {
    error.value = e.message || t('schedule_submit_fail');
  } finally {
    submitting.value = false;
  }
};

const toLocalDatetime = (value) => {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 16);
};

const goSchedule = () => {
  router.push('/schedule');
};

const initFromRoute = async () => {
  error.value = '';
  result.value = null;

  const id = Number(route.params.id || 0);
  isEdit.value = id > 0;
  editId.value = id > 0 ? id : null;

  if (!isEdit.value) {
    form.execType = 'once';
    form.name = '';
    form.prompt = '';
    form.runAt = '';
    form.cron = '';
    return;
  }

  try {
    const res = await fetch(`/api/schedule/detail?id=${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !data.schedule) throw new Error(data.message || `HTTP ${res.status}`);
    const schedule = data.schedule;
    form.name = schedule.name || '';
    form.prompt = schedule.prompt || '';
    if (schedule.cron) {
      form.execType = 'repeat';
      form.cron = schedule.cron;
      form.runAt = '';
    } else {
      form.execType = 'once';
      form.runAt = toLocalDatetime(schedule.run_at);
      form.cron = '';
    }
  } catch (e) {
    error.value = e.message || t('schedule_submit_fail');
  }
};

watch(() => route.params.id, () => {
  initFromRoute();
}, { immediate: true });
</script>
