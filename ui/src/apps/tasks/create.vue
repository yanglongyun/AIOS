<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-5">
        <h1 class="m-0 text-xl font-bold text-[#4a3a28]">__T_TASKS_CREATE_TITLE__</h1>
        <p class="mt-0.5 text-xs text-[#a0907a]">__T_TASKS_CREATE_SUBTITLE__</p>
      </div>

      <div v-if="error" class="mb-4 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div class="space-y-4">
          <div>
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">__T_TASKS_EXEC_TYPE__</label>
            <div class="flex gap-2">
              <button
                v-for="x in execTypes"
                :key="x.value"
                type="button"
                class="cursor-pointer rounded-lg border px-4 py-1.5 text-xs transition"
                :class="form.execType === x.value ? 'border-[#c8a060] bg-[#f8f0e0] font-semibold text-[#7a5a28]' : 'border-[#e8dcc8] bg-[#fcfaf6] text-[#7a6a58] hover:bg-[#f6ecde]'"
                @click="form.execType = x.value"
              >{{ x.label }}</button>
            </div>
          </div>

          <div v-if="form.execType !== 'now'">
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">__T_TASKS_NAME__</label>
            <input v-model="form.name" type="text" placeholder="__T_TASKS_NAME_PH__" class="w-full rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 text-[13px] text-[#4a3a28] outline-none transition focus:border-[#c8a060]">
          </div>

          <div>
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">__T_TASKS_PROMPT__</label>
            <textarea v-model="form.prompt" rows="6" placeholder="__T_TASKS_PROMPT_PH__" class="w-full resize-y rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 text-[13px] leading-relaxed text-[#4a3a28] outline-none transition focus:border-[#c8a060]" />
          </div>

          <div v-if="form.execType === 'once'">
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">__T_TASKS_RUN_AT__</label>
            <input v-model="form.runAt" type="datetime-local" class="w-full rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 text-[13px] text-[#4a3a28] outline-none transition focus:border-[#c8a060]">
          </div>

          <div v-if="form.execType === 'repeat'">
            <label class="mb-1 block text-[11px] font-semibold text-[#a0907a]">__T_TASKS_CRON__</label>
            <input v-model="form.cron" type="text" placeholder="0 8 * * *" class="w-full rounded-lg border border-[#e8dcc8] bg-[#fcfaf6] px-3 py-2 font-mono text-[13px] text-[#4a3a28] outline-none transition focus:border-[#c8a060]">
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button type="button" class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-4 py-2 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]" @click="$router.push('/tasks')">__T_TASKS_CANCEL__</button>
            <button type="button" class="cursor-pointer rounded-lg border border-[#c8a060] bg-[#f8f0e0] px-5 py-2 text-xs font-semibold text-[#7a5a28] transition hover:bg-[#f0e4c8] disabled:cursor-not-allowed disabled:opacity-60" :disabled="submitting" @click="submit">{{ submitting ? '__T_TASKS_SUBMITTING__' : submitLabel }}</button>
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
  const res = await fetch('/aios/api/task/schedule/create', {
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
