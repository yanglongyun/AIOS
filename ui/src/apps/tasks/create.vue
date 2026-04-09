<template>
  <div class="flex h-full flex-col bg-[#f8f8f7]">
    <!-- 顶栏 -->
    <div class="flex shrink-0 items-center border-b border-black/[0.07] bg-white px-5 py-3.5">
      <h1 class="text-[15px] font-bold text-[#222]">__T_TASKS_CREATE_TITLE__</h1>
    </div>

    <!-- 内容 -->
    <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:thin]">
      <div class="mx-auto max-w-[620px]">
        <p class="mb-5 text-[13px] text-black/40">__T_TASKS_CREATE_SUBTITLE__</p>

        <div v-if="error" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-600">{{ error }}</div>

        <div class="space-y-4 rounded-[16px] border border-black/[0.07] bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <!-- 执行类型 -->
          <div>
            <label class="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-black/35">__T_TASKS_EXEC_TYPE__</label>
            <div class="flex gap-2">
              <button
                v-for="x in execTypes"
                :key="x.value"
                type="button"
                class="rounded-[9px] border px-4 py-2 text-[13px] font-medium transition"
                :class="form.execType === x.value
                  ? 'border-[#222] bg-[#222] text-white'
                  : 'border-black/[0.1] bg-white text-black/50 hover:bg-black/[0.04]'"
                @click="form.execType = x.value"
              >{{ x.label }}</button>
            </div>
          </div>

          <!-- 名称 -->
          <div v-if="form.execType !== 'now'">
            <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-black/35">__T_TASKS_NAME__</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="__T_TASKS_NAME_PH__"
              class="w-full rounded-[10px] border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 text-[13px] text-[#222] outline-none transition focus:border-black/[0.3] focus:bg-white"
            >
          </div>

          <!-- 提示词 -->
          <div>
            <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-black/35">__T_TASKS_PROMPT__</label>
            <textarea
              v-model="form.prompt"
              rows="6"
              placeholder="__T_TASKS_PROMPT_PH__"
              class="w-full resize-y rounded-[10px] border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#222] outline-none transition focus:border-black/[0.3] focus:bg-white"
            />
          </div>

          <!-- 执行时间（单次） -->
          <div v-if="form.execType === 'once'">
            <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-black/35">__T_TASKS_RUN_AT__</label>
            <input
              v-model="form.runAt"
              type="datetime-local"
              class="w-full rounded-[10px] border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 text-[13px] text-[#222] outline-none transition focus:border-black/[0.3] focus:bg-white"
            >
          </div>

          <!-- Cron（重复） -->
          <div v-if="form.execType === 'repeat'">
            <label class="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-black/35">__T_TASKS_CRON__</label>
            <input
              v-model="form.cron"
              type="text"
              placeholder="0 8 * * *"
              class="w-full rounded-[10px] border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 font-mono text-[13px] text-[#222] outline-none transition focus:border-black/[0.3] focus:bg-white"
            >
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center justify-end gap-2.5 border-t border-black/[0.06] pt-4">
            <button
              type="button"
              class="rounded-[9px] border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-medium text-black/50 transition hover:bg-black/[0.04]"
              @click="$router.push('/tasks')"
            >__T_TASKS_CANCEL__</button>
            <button
              type="button"
              class="rounded-[9px] bg-[#222] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="submitting"
              @click="submit"
            >{{ submitting ? '__T_TASKS_SUBMITTING__' : submitLabel }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const execTypes = computed(() => ([
  { value: 'once', label: '__T_TASKS_EXEC_ONCE__' },
  { value: 'repeat', label: '__T_TASKS_EXEC_REPEAT__' }
]));

const form = reactive({
  execType: 'once',
  name: '',
  prompt: '',
  runAt: '',
  cron: ''
});

const error = ref('');
const submitting = ref(false);

const submitLabel = computed(() => {
  if (form.execType === 'once') return '__T_TASKS_SUBMIT_ONCE__';
  return '__T_TASKS_SUBMIT_REPEAT__';
});

const submitSchedule = async () => {
  const body = { name: form.name.trim(), prompt: form.prompt.trim() };
  if (form.execType === 'once') body.run_at = form.runAt;
  if (form.execType === 'repeat') body.cron = form.cron.trim();
  const res = await fetch('/api/task/schedule/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `HTTP ${res.status}`);
};

const submit = async () => {
  error.value = '';
  if (!form.prompt.trim()) { error.value = '__T_TASKS_ERR_PROMPT__'; return; }
  if (!form.name.trim()) { error.value = '__T_TASKS_ERR_NAME__'; return; }
  if (form.execType === 'once' && !form.runAt) { error.value = '__T_TASKS_ERR_RUN_AT__'; return; }
  if (form.execType === 'repeat' && !form.cron.trim()) { error.value = '__T_TASKS_ERR_CRON__'; return; }

  submitting.value = true;
  try {
    await submitSchedule();
    router.push('/tasks');
  } catch (e) {
    error.value = e.message || '__T_TASKS_SUBMIT_FAILED__';
  } finally {
    submitting.value = false;
  }
};
</script>
