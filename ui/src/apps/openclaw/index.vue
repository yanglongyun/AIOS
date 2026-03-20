<template>
  <div class="flex h-full flex-col overflow-hidden bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif]">
    <!-- 顶栏：状态 + Tab -->
    <div class="shrink-0 border-b border-[#e0d0b8] px-5 pt-4 pb-0">
      <div class="mb-3 flex items-center gap-2">
        <span class="text-[22px]">🦞</span>
        <span class="text-base font-bold text-[#3a2a18]">OpenClaw</span>
        <span class="ml-auto flex items-center gap-1.5 text-[11px]">
          <span class="h-2 w-2 rounded-full" :class="status.online ? (status.gateway ? 'bg-[#6a9a4a]' : 'bg-[#d4a840]') : 'bg-[#c04040]'"></span>
          <span class="text-[#9a8870]">{{ status.online ? (status.gateway ? t('openclaw_online') : t('openclaw_no_gateway')) : t('openclaw_offline') }}</span>
          <span v-if="status.version" class="text-[#b0a090]">{{ status.version }}</span>
        </span>
      </div>
      <div class="flex gap-0">
        <button v-for="tab in tabs" :key="tab" @click="activeTab = tab"
          class="border-b-2 px-4 py-2 text-[13px] font-semibold transition-colors"
          :class="activeTab === tab ? 'border-[#c8a060] text-[#3a2a18]' : 'border-transparent text-[#a09080] hover:text-[#5a4a38]'"
        >{{ t(`openclaw_tab_${tab}`) }}</button>
      </div>
    </div>

    <!-- Cron Tab -->
    <div v-if="activeTab === 'cron'" class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-[13px] font-semibold text-[#5a4a38]">{{ t('openclaw_cron_title') }}</span>
        <div class="flex gap-2">
          <button @click="loadCron" class="rounded-lg border border-[#d4c0a0] px-3 py-1 text-[11px] text-[#8a6a40] transition-colors hover:bg-[rgba(200,160,96,0.1)]">{{ t('openclaw_refresh') }}</button>
          <button @click="showAdd = !showAdd" class="rounded-lg bg-[#c8a060] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#b89050]">+ {{ t('openclaw_cron_add') }}</button>
        </div>
      </div>

      <!-- 新建表单 -->
      <div v-if="showAdd" class="mb-4 rounded-xl border border-[#d4c0a0] bg-white p-4">
        <input v-model="addForm.name" :placeholder="t('openclaw_cron_name_ph')" class="mb-2 w-full rounded-lg border border-[#e0d0b8] px-3 py-2 text-[13px] outline-none focus:border-[#c8a060]" />
        <input v-model="addForm.cron" :placeholder="t('openclaw_cron_cron_ph')" class="mb-2 w-full rounded-lg border border-[#e0d0b8] px-3 py-2 text-[13px] outline-none focus:border-[#c8a060]" />
        <textarea v-model="addForm.prompt" :placeholder="t('openclaw_cron_prompt_ph')" rows="2" class="mb-2 w-full resize-none rounded-lg border border-[#e0d0b8] px-3 py-2 text-[13px] outline-none focus:border-[#c8a060]" />
        <div class="flex justify-end gap-2">
          <button @click="showAdd = false" class="px-3 py-1.5 text-[12px] text-[#9a8870]">{{ t('openclaw_cancel') }}</button>
          <button @click="doAddCron" :disabled="addBusy" class="rounded-lg bg-[#c8a060] px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50">{{ t('openclaw_cron_create') }}</button>
        </div>
      </div>

      <!-- 任务列表 -->
      <div v-if="cronError" class="mb-3 rounded-lg border border-[#c04040]/20 bg-[#c04040]/5 px-3 py-2 text-[12px] text-[#c04040]">{{ cronError }}</div>
      <div v-if="cronNotice" class="mb-3 rounded-lg border border-[#6a9a4a]/20 bg-[#6a9a4a]/5 px-3 py-2 text-[12px] text-[#5a7a3a]">{{ cronNotice }}</div>
      <div v-if="!cronJobs.length && !cronError" class="py-12 text-center text-[13px] text-[#a09080]">{{ t('openclaw_cron_empty') }}</div>
      <div v-for="job in cronJobs" :key="job.id" class="mb-2 rounded-xl border border-[#e0d0b8] bg-white px-4 py-3">
        <div class="flex items-start justify-between">
          <div class="min-w-0 flex-1">
            <div class="text-[13px] font-semibold text-[#3a2a18]">{{ job.name || job.id }}</div>
            <div class="mt-0.5 text-[11px] text-[#a09080]">
              <span v-if="job.schedule?.cron">cron: {{ job.schedule.cron }}</span>
              <span v-else-if="job.schedule?.at">at: {{ job.schedule.at }}</span>
              <span v-else-if="job.schedule?.every">every: {{ job.schedule.every }}ms</span>
              <span v-if="job.lastRunAt" class="ml-2">{{ t('openclaw_last_run') }} {{ job.lastRunAt }}</span>
            </div>
            <div v-if="job.state?.lastStatus" class="mt-0.5 text-[11px] text-[#9a8870]">{{ t('openclaw_last_status') }} {{ job.state.lastStatus }}</div>
            <div v-if="job.state?.lastError" class="mt-0.5 text-[11px] text-[#c04040]">{{ t('openclaw_last_error') }} {{ job.state.lastError }}</div>
          </div>
          <div class="flex shrink-0 gap-1">
            <button @click="toggleRuns(job.id)" class="rounded-lg border border-[#d4c0a0] px-2.5 py-1 text-[10px] text-[#8a6a40] hover:bg-[rgba(200,160,96,0.1)]">{{ t('openclaw_history') }}</button>
            <button @click="startEditCron(job)" class="rounded-lg border border-[#d4c0a0] px-2.5 py-1 text-[10px] text-[#8a6a40] hover:bg-[rgba(200,160,96,0.1)]">{{ t('openclaw_edit') }}</button>
            <button @click="doRunCron(job.id)" class="rounded-lg border border-[#d4c0a0] px-2.5 py-1 text-[10px] text-[#8a6a40] hover:bg-[rgba(200,160,96,0.1)]">{{ t('openclaw_run') }}</button>
            <button @click="doDeleteCron(job.id)" class="rounded-lg border border-[#c04040]/30 px-2.5 py-1 text-[10px] text-[#c04040] hover:bg-[#c04040]/5">{{ t('openclaw_delete') }}</button>
          </div>
        </div>
        <div v-if="editingCronId === job.id" class="mt-3 rounded-lg border border-[#e0d0b8] bg-[#faf7f2] p-3">
          <input v-model="editForm.name" :placeholder="t('openclaw_cron_name_ph')" class="mb-2 w-full rounded-lg border border-[#e0d0b8] px-3 py-2 text-[13px] outline-none focus:border-[#c8a060]" />
          <input v-model="editForm.cron" :placeholder="t('openclaw_cron_cron_ph')" class="mb-2 w-full rounded-lg border border-[#e0d0b8] px-3 py-2 text-[13px] outline-none focus:border-[#c8a060]" />
          <textarea v-model="editForm.prompt" :placeholder="t('openclaw_cron_prompt_ph')" rows="2" class="w-full resize-none rounded-lg border border-[#e0d0b8] px-3 py-2 text-[13px] outline-none focus:border-[#c8a060]" />
          <div class="mt-2 flex justify-end gap-2">
            <button @click="cancelEditCron" class="px-3 py-1.5 text-[12px] text-[#9a8870]">{{ t('openclaw_cancel') }}</button>
            <button @click="doUpdateCron" :disabled="editBusy" class="rounded-lg bg-[#c8a060] px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50">{{ t('openclaw_save') }}</button>
          </div>
        </div>
        <div v-if="openRunsJobId === job.id" class="mt-3 rounded-lg border border-[#e0d0b8] bg-[#faf7f2] p-3">
          <div v-if="runsLoading" class="text-[12px] text-[#9a8870]">{{ t('openclaw_loading_history') }}</div>
          <div v-else-if="!runsByJob[job.id]?.length" class="text-[12px] text-[#9a8870]">{{ t('openclaw_history_empty') }}</div>
          <div v-else class="space-y-2">
            <div v-for="(r, idx) in runsByJob[job.id]" :key="idx" class="rounded-md border border-[#eadfcf] bg-white px-3 py-2">
              <div class="text-[11px] text-[#8a7a60]">
                <span>{{ formatTs(r.ts) }}</span>
                <span class="ml-2">{{ t('openclaw_last_status') }} {{ r.status || '-' }}</span>
                <span v-if="r.durationMs" class="ml-2">{{ r.durationMs }}ms</span>
              </div>
              <div v-if="r.summary" class="mt-1 whitespace-pre-wrap text-[12px] text-[#4a3a28]">{{ r.summary }}</div>
              <div v-if="r.error" class="mt-1 whitespace-pre-wrap text-[11px] text-[#c04040]">{{ t('openclaw_last_error') }} {{ r.error }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Tab -->
    <div v-if="activeTab === 'chat'" class="flex min-h-0 flex-1 flex-col">
      <div ref="msgBox" class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div v-if="!chatMessages.length" class="py-12 text-center text-[13px] text-[#a09080]">{{ t('openclaw_chat_empty') }}</div>
        <div v-for="(m, i) in chatMessages" :key="i" class="mb-3">
          <div v-if="m.role === 'user'" class="flex justify-end">
            <div class="max-w-[80%] rounded-[14px_14px_4px_14px] bg-[#5a3e28] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#f0e8d8]">{{ m.content }}</div>
          </div>
          <div v-else class="flex items-start gap-2">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ece4d8] text-[14px]">🦞</div>
            <div class="max-w-[80%] whitespace-pre-wrap rounded-[14px_14px_14px_4px] border border-[#e0d0b8] bg-white px-3.5 py-2.5 text-[13px] leading-relaxed text-[#4a3a28]">{{ m.content }}</div>
          </div>
        </div>
        <div v-if="chatBusy" class="flex items-start gap-2">
          <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ece4d8] text-[14px]">🦞</div>
          <div class="py-2 text-[13px] text-[#a09080]">{{ t('openclaw_thinking') }}<span class="animate-pulse">...</span></div>
        </div>
      </div>
      <div class="shrink-0 border-t border-[#e0d0b8] px-5 py-3">
        <form @submit.prevent="doChat" class="flex gap-2">
          <input v-model="chatInput" :placeholder="t('openclaw_chat_ph')" :disabled="chatBusy" class="min-w-0 flex-1 rounded-xl border border-[#d4c0a0] bg-white px-4 py-2.5 text-[13px] outline-none placeholder:text-[#b0a090] focus:border-[#c8a060] disabled:opacity-50" />
          <button type="submit" :disabled="!chatInput.trim() || chatBusy" class="rounded-xl bg-[#c8a060] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#b89050] disabled:opacity-40">{{ t('openclaw_send') }}</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../i18n/index.js';
import { chatPanel } from '../../stores/chatPanel.js';

const { t } = useI18n();
const API = '/aios/apps/openclaw';

const status = ref({ online: false, version: null, gateway: false });
const activeTab = ref('cron');
const tabs = ['cron', 'chat'];

// Cron
const cronJobs = ref([]);
const cronError = ref('');
const cronNotice = ref('');
const showAdd = ref(false);
const addBusy = ref(false);
const addForm = ref({ name: '', cron: '', prompt: '' });
const editingCronId = ref('');
const editBusy = ref(false);
const editForm = ref({ name: '', cron: '', prompt: '' });
const openRunsJobId = ref('');
const runsLoading = ref(false);
const runsByJob = ref({});

const loadStatus = async () => {
  try {
    const res = await fetch(`${API}/status`);
    status.value = await res.json();
  } catch { status.value = { online: false, version: null, gateway: false }; }
};

const loadCron = async () => {
  cronError.value = '';
  cronNotice.value = '';
  try {
    const res = await fetch(`${API}/cron/list`);
    const data = await res.json();
    if (!data.success) { cronError.value = data.message; return; }
    cronJobs.value = Array.isArray(data.jobs) ? data.jobs : [];
  } catch (e) { cronError.value = e.message; }
};

const doAddCron = async () => {
  cronError.value = '';
  cronNotice.value = '';
  addBusy.value = true;
  try {
    const res = await fetch(`${API}/cron/add`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addForm.value.name, schedule: { cron: addForm.value.cron }, prompt: addForm.value.prompt })
    });
    const data = await res.json();
    if (!data.success) { cronError.value = data.message; return; }
    showAdd.value = false;
    addForm.value = { name: '', cron: '', prompt: '' };
    await loadCron();
  } catch (e) { cronError.value = e.message; }
  finally { addBusy.value = false; }
};

const doRunCron = async (jobId) => {
  cronError.value = '';
  cronNotice.value = '';
  try {
    const res = await fetch(`${API}/cron/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
    const data = await res.json();
    if (!data.success) { cronError.value = data.message || 'run failed'; return; }
    cronNotice.value = t('openclaw_run_triggered');
    await loadCron();
    setTimeout(() => { loadCron(); }, 1500);
  } catch (e) { cronError.value = e.message; }
};

const doDeleteCron = async (jobId) => {
  cronError.value = '';
  cronNotice.value = '';
  try {
    await fetch(`${API}/cron/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
    await loadCron();
  } catch (e) { cronError.value = e.message; }
};

const formatTs = (ts) => {
  const n = Number(ts || 0);
  if (!n) return '';
  const d = new Date(n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};

const toggleRuns = async (jobId) => {
  const id = String(jobId || '');
  if (!id) return;
  if (openRunsJobId.value === id) {
    openRunsJobId.value = '';
    return;
  }
  openRunsJobId.value = id;
  runsLoading.value = true;
  try {
    const res = await fetch(`${API}/cron/runs?jobId=${encodeURIComponent(id)}&limit=10`);
    const data = await res.json();
    if (!data.success) {
      cronError.value = data.message || 'load runs failed';
      return;
    }
    runsByJob.value[id] = Array.isArray(data.entries) ? data.entries : [];
  } catch (e) {
    cronError.value = e.message;
  } finally {
    runsLoading.value = false;
  }
};

const startEditCron = (job) => {
  showAdd.value = false;
  editingCronId.value = String(job?.id || '');
  editForm.value = {
    name: String(job?.name || ''),
    cron: String(job?.schedule?.cron || ''),
    prompt: String(job?.prompt || '')
  };
};

const cancelEditCron = () => {
  editingCronId.value = '';
  editForm.value = { name: '', cron: '', prompt: '' };
};

const doUpdateCron = async () => {
  if (!editingCronId.value) {
    cronError.value = 'jobId 必填';
    return;
  }
  cronError.value = '';
  cronNotice.value = '';
  editBusy.value = true;
  try {
    const res = await fetch(`${API}/cron/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: editingCronId.value,
        name: editForm.value.name,
        schedule: { cron: editForm.value.cron },
        prompt: editForm.value.prompt
      })
    });
    const data = await res.json();
    if (!data.success) { cronError.value = data.message; return; }
    cancelEditCron();
    await loadCron();
  } catch (e) {
    cronError.value = e.message;
  } finally {
    editBusy.value = false;
  }
};

// Chat
const chatMessages = ref([]);
const chatInput = ref('');
const chatBusy = ref(false);
const msgBox = ref(null);

const scrollBottom = () => nextTick(() => { if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight; });

const doChat = async () => {
  const msg = chatInput.value.trim();
  if (!msg || chatBusy.value) return;
  chatMessages.value.push({ role: 'user', content: msg });
  chatInput.value = '';
  chatBusy.value = true;
  scrollBottom();
  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: chatMessages.value.slice(0, -1) })
    });
    const data = await res.json();
    if (data.success) chatMessages.value.push({ role: 'assistant', content: data.reply });
    else chatMessages.value.push({ role: 'assistant', content: `Error: ${data.message}` });
  } catch (e) { chatMessages.value.push({ role: 'assistant', content: `Error: ${e.message}` }); }
  finally { chatBusy.value = false; scrollBottom(); }
};

onMounted(() => {
  chatPanel.setContext({ scene: 'openclaw', label: t('app_sidebar_openclaw') });
  chatPanel.setQuickMessages([t('openclaw_chat_quick_1'), t('openclaw_chat_quick_2'), t('openclaw_chat_quick_3')]);
  loadStatus();
  loadCron();
});
onUnmounted(() => { chatPanel.clearContext(); chatPanel.setQuickMessages([]); });
</script>
