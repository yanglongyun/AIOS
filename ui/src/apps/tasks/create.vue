<template>
  <div class="create-shell flex h-full flex-col overflow-hidden font-['Georgia','PingFang_SC',serif]">
    <div class="cork-bg absolute inset-0"></div>
    <div class="frame-top shrink-0"></div>

    <div class="relative z-[1] flex min-h-0 flex-1 flex-col">
      <div class="topbar flex shrink-0 items-center justify-between gap-3 px-5 py-3">
        <div class="flex items-center gap-3">
          <div class="badge">📌</div>
          <div>
            <div class="text-[15px] font-bold text-[#3a2810]">__T_TASKS_CREATE_TITLE__</div>
            <div class="text-[11px] text-[rgba(58,40,16,0.55)]">定时任务与循环任务</div>
          </div>
        </div>
        <button type="button" class="wood-btn px-3 py-1.5 text-[11px] font-bold" @click="closeWindow">__T_TASKS_CANCEL__</button>
      </div>

      <div class="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-6 scrollbar-hide">
        <div class="paper-card relative w-full max-w-[680px] rounded-sm px-6 py-5">
          <div class="pin pin-red absolute -top-[4px] right-6 h-4 w-4 rounded-full"></div>

          <div class="mb-5">
            <div class="section-kicker">NEW SCHEDULE</div>
            <div class="mt-1 text-[22px] font-bold text-[#3a2810]">把任务钉到时间线上</div>
            <p class="mt-2 text-[13px] leading-relaxed text-[#6d5a3d]">支持一次性定时执行，也支持按 cron 表达式循环执行。</p>
          </div>

          <div v-if="error" class="warn-card mb-4 rounded-sm px-4 py-3 text-[12px] text-[#7a2818]">{{ error }}</div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
              <div class="field-label">执行类型</div>
              <div class="flex gap-2">
                <button
                  v-for="x in execTypes"
                  :key="x.value"
                  type="button"
                  class="mode-btn px-4 py-2 text-[12px] font-bold"
                  :class="form.execType === x.value ? 'mode-on' : 'mode-off'"
                  @click="form.execType = x.value"
                >{{ x.label }}</button>
              </div>
            </div>

            <div class="md:col-span-2">
              <div class="field-label">__T_TASKS_NAME__</div>
              <input
                v-model="form.name"
                type="text"
                placeholder="__T_TASKS_NAME_PH__"
                class="field-input w-full"
              >
            </div>

            <div class="md:col-span-2">
              <div class="field-label">__T_TASKS_PROMPT__</div>
              <textarea
                v-model="form.prompt"
                rows="6"
                placeholder="__T_TASKS_PROMPT_PH__"
                class="field-input min-h-[150px] w-full resize-y"
              />
            </div>

            <div v-if="form.execType === 'once'" class="md:col-span-2">
              <div class="field-label">__T_TASKS_RUN_AT__</div>
              <input
                v-model="form.runAt"
                type="datetime-local"
                class="field-input w-full"
              >
            </div>

            <div v-if="form.execType === 'repeat'" class="md:col-span-2">
              <div class="field-label">__T_TASKS_CRON__</div>
              <input
                v-model="form.cron"
                type="text"
                placeholder="0 8 * * *"
                class="field-input w-full font-['Courier_New',monospace]"
              >
            </div>
          </div>

          <div class="mt-5 flex items-center justify-end gap-2 border-t border-dashed border-[rgba(120,90,50,0.2)] pt-4">
            <button type="button" class="wood-btn px-4 py-2 text-[12px] font-bold" @click="closeWindow">__T_TASKS_CANCEL__</button>
            <button
              type="button"
              class="brass-btn px-5 py-2 text-[12px] font-bold"
              :disabled="submitting"
              @click="submit"
            >{{ submitting ? '__T_TASKS_SUBMITTING__' : submitLabel }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="frame-bottom shrink-0"></div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { windowManager } from '../../system/windows.js';

const viewProps = defineProps({
  __windowId: { type: String, default: '' }
});
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

const submitLabel = computed(() => form.execType === 'once' ? '__T_TASKS_SUBMIT_ONCE__' : '__T_TASKS_SUBMIT_REPEAT__');
const closeWindow = () => {
  if (viewProps.__windowId) {
    windowManager.close(viewProps.__windowId);
  }
};

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
    closeWindow();
  } catch (e) {
    error.value = e.message || '__T_TASKS_SUBMIT_FAILED__';
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.create-shell {
  position: relative;
  background: linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
}
.cork-bg {
  background:
    repeating-conic-gradient(rgba(160, 120, 70, 0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180, 140, 80, 0.02) 0px, transparent 1px, transparent 4px),
    repeating-linear-gradient(85deg, rgba(120, 80, 40, 0.02) 0px, transparent 1px, transparent 6px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
  box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.3);
}
.frame-top { height: 7px; background: linear-gradient(180deg, #4a3420, #3a2414); box-shadow: 0 3px 6px rgba(0, 0, 0, 0.35); }
.frame-bottom { height: 7px; background: linear-gradient(0deg, #4a3420, #3a2414); box-shadow: 0 -3px 6px rgba(0, 0, 0, 0.35); }
.topbar {
  background: linear-gradient(180deg, rgba(60, 42, 24, 0.58), rgba(50, 35, 20, 0.3));
  border-bottom: 1px solid rgba(0, 0, 0, 0.16);
}
.badge {
  display: flex;
  height: 36px;
  width: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid #6a4a18;
  background: radial-gradient(circle at 42% 38%, #c8a060, #8a6a30);
  box-shadow: inset 0 2px 3px rgba(255, 220, 150, 0.3), 0 2px 4px rgba(0, 0, 0, 0.4);
}
.paper-card {
  background: linear-gradient(180deg, #faf4e4, #f4ecda, #f0e6d0);
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.18), 2px 3px 6px rgba(0, 0, 0, 0.08), inset 0 0 20px rgba(200, 180, 140, 0.12);
}
.section-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(122, 98, 58, 0.72);
}
.field-label {
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7a6546;
}
.field-input {
  border: none;
  border-bottom: 1px solid rgba(160, 140, 100, 0.35);
  background: rgba(255, 255, 255, 0.18);
  padding: 10px 4px;
  font-size: 13px;
  color: #3a2810;
  outline: none;
}
.field-input::placeholder { color: rgba(160, 140, 100, 0.5); }
.field-input:focus { border-bottom-color: #a08030; }
.mode-btn {
  border-radius: 6px;
  border: 1px solid rgba(120, 90, 50, 0.18);
  cursor: pointer;
}
.mode-on {
  background: linear-gradient(180deg, #d8b868, #b89838, #a08028);
  color: #3a2008;
  border-color: #8a6a20;
  box-shadow: 0 2px 0 rgba(60, 30, 0, 0.4), inset 0 1px 1px rgba(255, 255, 200, 0.3);
}
.mode-off {
  background: rgba(0, 0, 0, 0.04);
  color: #756244;
}
.warn-card {
  border: 1px solid rgba(170, 70, 54, 0.18);
  background: rgba(255, 235, 220, 0.78);
}
.pin { box-shadow: 0 2px 3px rgba(0, 0, 0, 0.3); }
.pin::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 3px;
  height: 3px;
  width: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
}
.pin-red { background: radial-gradient(circle at 38% 32%, #ff8888, #c83030); border: 1px solid #a02020; }
.wood-btn,
.brass-btn {
  border-radius: 6px;
  cursor: pointer;
}
.wood-btn {
  border: 1px solid #3a2810;
  color: rgba(255, 220, 150, 0.65);
  background: linear-gradient(180deg, #6a5838, #4a3820);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
}
.brass-btn {
  color: #3a2008;
  background: linear-gradient(180deg, #d8b868, #b89838, #a08028);
  border: 1px solid #8a6a20;
  box-shadow: 0 2px 0 rgba(60, 30, 0, 0.4), inset 0 1px 1px rgba(255, 255, 200, 0.35);
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
