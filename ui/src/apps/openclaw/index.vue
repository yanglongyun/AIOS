<template>
  <div class="flex h-full flex-col overflow-hidden font-['Georgia','PingFang_SC',serif] bg-[#2a1e14] relative">
    <div class="cork-bg"></div>
    <div class="frame-t"></div>

    <div class="flex-1 min-h-0 relative z-[2] overflow-hidden">

      <!-- 时刻表页 -->
      <div class="page" :class="currentView === 'timetable' ? 'active' : 'hide-left'">
        <div class="flex shrink-0 items-center gap-2.5 px-4 pt-2 pb-1.5">
          <div class="t-badge flex items-center justify-center w-[34px] h-[34px] rounded-full border-2 border-[#6a4a18] text-base">🦞</div>
          <div class="flex-1">
            <div class="text-sm font-bold text-[#3a2810]">OpenClaw</div>
            <div class="flex items-center gap-1 mt-px">
              <span class="w-1 h-1 rounded-full" :class="status.online ? (status.gateway ? 'dot-on' : 'dot-warn') : 'bg-[#6a4a3a]'"></span>
              <span class="text-[8px] text-[rgba(60,40,20,0.4)]">{{ status.online ? (status.gateway ? t('openclaw_online') : t('openclaw_no_gateway')) : t('openclaw_offline') }}{{ status.version ? ' · ' + status.version : '' }}</span>
            </div>
          </div>
          <button class="brass-btn px-3 py-1 rounded cursor-pointer text-[9px] font-bold tracking-wider text-white border border-[#7a5818]" @click="showNew = true">{{ t('openclaw_new_task') }}</button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto pb-8 scrollbar-hide" ref="timetableRef">
          <template v-if="!cronJobs.length && !cronError">
            <div class="py-10 text-center text-xs text-[rgba(255,230,180,0.3)]">{{ t('openclaw_cron_empty') }}</div>
          </template>
          <template v-else>
            <template v-for="slot in pastSlots" :key="'past-'+slot.key">
              <div class="hour-row relative min-h-[48px] pl-[58px] pr-4" :class="{ major: slot.major }">
                <div class="hour-label absolute top-[-2px] left-1.5 w-[42px] text-right text-[13px] font-extrabold tracking-wide font-['Courier_New',monospace] leading-none" style="color:rgba(255,230,180,0.35)">{{ slot.label }}</div>
                <div v-if="slot.job" class="task-card cursor-pointer overflow-hidden rounded-sm my-1.5" :class="['past', 'tilt-'+((slot.idx%4)+1)]" @click="openDetail(slot.job)">
                  <div class="pin" :class="pinColor(slot.idx)"></div>
                  <div class="stripe" :class="stripeColor(slot.idx)"></div>
                  <div class="px-3 py-2.5 pl-3.5">
                    <div class="flex items-center gap-2">
                      <span class="text-xl shrink-0">{{ jobEmoji(slot.idx) }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-[#3a2810] truncate">{{ slot.job.name || slot.job.id }}</div>
                        <div class="text-[9px] text-[#9a8a68] font-['Courier_New',monospace] mt-px">{{ scheduleText(slot.job) }} · {{ t('openclaw_executed') }}</div>
                      </div>
                    </div>
                    <div v-if="slot.job.message" class="mt-1.5 text-[11px] leading-relaxed text-[#6a5838] italic line-clamp-2">{{ slot.job.message }}</div>
                  </div>
                </div>
              </div>
            </template>

            <div class="hour-row major relative min-h-[48px] pl-[58px] pr-4" ref="nowRef">
              <div class="hour-label now-label absolute top-[-2px] left-1.5 w-[42px] text-right text-sm font-black font-['Courier_New',monospace] leading-none">{{ nowLabel }}</div>
            </div>
            <div class="now-line"><span class="now-tag">{{ t('openclaw_now') }}</span></div>

            <template v-for="slot in futureSlots" :key="'future-'+slot.key">
              <div class="hour-row relative min-h-[48px] pl-[58px] pr-4" :class="{ major: slot.major }">
                <div class="hour-label absolute top-[-2px] left-1.5 w-[42px] text-right text-[13px] font-extrabold tracking-wide font-['Courier_New',monospace] leading-none" style="color:rgba(180,230,150,0.7)">{{ slot.label }}</div>
                <div v-if="slot.job" class="task-card cursor-pointer overflow-hidden rounded-sm my-1.5" :class="'tilt-'+((slot.idx%4)+1)" @click="openDetail(slot.job)">
                  <div class="pin" :class="pinColor(slot.idx)"></div>
                  <div class="stripe" :class="stripeColor(slot.idx)"></div>
                  <div v-if="slot.idx % 3 === 0" class="tape" style="top:4px;left:-6px;transform:rotate(-10deg)"></div>
                  <div class="px-3 py-2.5 pl-3.5">
                    <div class="flex items-center gap-2">
                      <span class="text-xl shrink-0">{{ jobEmoji(slot.idx) }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-[#3a2810] truncate">{{ slot.job.name || slot.job.id }}</div>
                        <div class="text-[9px] text-[#9a8a68] font-['Courier_New',monospace] mt-px">{{ scheduleText(slot.job) }} · {{ slot.countdown }}</div>
                      </div>
                    </div>
                    <div v-if="slot.job.message" class="mt-1.5 text-[11px] leading-relaxed text-[#6a5838] italic line-clamp-2">{{ slot.job.message }}</div>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>

      <!-- 详情页 -->
      <div class="page page-bg" :class="currentView === 'detail' ? 'active' : (currentView === 'viz' ? 'hide-left' : 'hide-right')" style="z-index:3">
        <div class="flex shrink-0 items-center gap-2.5 px-4 pt-2 pb-1.5">
          <button class="back-btn px-3 py-1 rounded cursor-pointer text-[10px] font-bold border border-[#3a2810] text-[rgba(255,220,150,0.6)]" @click="currentView = 'timetable'">{{ t('openclaw_back') }}</button>
          <div class="flex-1 text-[13px] font-bold text-[#3a2810] truncate">{{ selectedJob?.name || '' }}</div>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto px-4 pb-6 scrollbar-hide">
          <div v-if="selectedJob" class="info-card rounded-sm p-3.5 mb-3.5">
            <div class="flex items-center gap-2.5 mb-1.5">
              <span class="text-[26px]">{{ jobEmoji(selectedJobIdx) }}</span>
              <div>
                <div class="text-base font-bold text-[#3a2810]">{{ selectedJob.name || selectedJob.id }}</div>
                <div class="text-[11px] text-[#9a8a68] font-['Courier_New',monospace] mt-0.5">{{ scheduleText(selectedJob) }}</div>
              </div>
            </div>
            <div v-if="selectedJob.message" class="text-xs leading-relaxed text-[#5a4830] italic py-2 border-t border-dashed border-[rgba(160,140,100,0.2)] mt-1.5">{{ selectedJob.message }}</div>
            <div class="flex gap-1.5 mt-2.5 pt-2 border-t border-dashed border-[rgba(160,140,100,0.2)]">
              <button class="ib ib-run px-3.5 py-1.5 rounded cursor-pointer text-[9px] font-bold" @click="doRun(selectedJob.id)">▶ {{ t('openclaw_run') }}</button>
              <button class="ib ib-del px-3.5 py-1.5 rounded cursor-pointer text-[9px] font-bold" @click="doDelete(selectedJob.id)">{{ t('openclaw_delete') }}</button>
            </div>
          </div>

          <div class="text-[10px] font-bold text-[rgba(255,230,180,0.5)] tracking-widest mb-2">{{ t('openclaw_runs_label') }}</div>
          <div v-if="runsLoading" class="py-10 text-center text-xs text-[rgba(255,230,180,0.3)]">...</div>
          <div v-else-if="!runs.length" class="py-10 text-center text-xs text-[rgba(255,230,180,0.3)]">{{ t('openclaw_no_runs') }}</div>
          <div v-for="(r, ri) in runs" :key="ri" class="run-card rounded-sm mb-2 overflow-hidden cursor-pointer" :class="{ open: expandedRun === ri }" @click="expandedRun = expandedRun === ri ? -1 : ri">
            <div class="flex items-center gap-2 px-3 py-2.5">
              <div class="w-2 h-2 rounded-full shrink-0" :class="r.ok !== false ? 'rd-ok' : 'rd-fail'"></div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-[#3a2810]">{{ r.time || r.startedAt || '—' }}</div>
                <div class="text-[9px] text-[#9a8a68] mt-px">{{ t('openclaw_run_duration') }} {{ r.duration || '—' }}</div>
              </div>
              <div class="shrink-0 text-[9px] font-bold" :class="r.ok !== false ? 'text-[#4a8a40]' : 'text-[#c05040]'">{{ r.ok !== false ? t('openclaw_run_ok') : t('openclaw_run_fail') }}</div>
              <div class="run-arrow shrink-0 text-[10px] text-[#c0b090] transition-transform duration-200">▸</div>
            </div>
            <div class="run-detail" @click.stop>
              <div class="run-output font-['Courier_New',monospace] text-[10px] leading-relaxed text-[#4a3a20] rounded p-2 max-h-[140px] overflow-y-auto whitespace-pre-wrap break-all scrollbar-hide">{{ r.output || r.result || '—' }}</div>
              <div v-if="r.ok !== false" class="flex gap-1.5 mt-2">
                <button class="viz-btn px-3.5 py-1 rounded cursor-pointer text-[9px] font-bold" @click="openViz(r)">{{ t('openclaw_visualize') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 可视化页 -->
      <div class="page page-bg" :class="currentView === 'viz' ? 'active' : 'hide-right'" style="z-index:4">
        <div class="flex shrink-0 items-center gap-2.5 px-4 pt-2 pb-1.5">
          <button class="back-btn px-3 py-1 rounded cursor-pointer text-[10px] font-bold border border-[#3a2810] text-[rgba(255,220,150,0.6)]" @click="currentView = 'detail'">{{ t('openclaw_back') }}</button>
          <div class="flex-1 text-[13px] font-bold text-[#3a2810] truncate">{{ t('openclaw_visualize') }}</div>
        </div>
        <div class="flex-1 min-h-0 mx-4 mb-4 rounded overflow-hidden bg-white relative shadow-md">
          <iframe class="w-full h-full border-none" ref="vizFrameRef"></iframe>
          <div class="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3 transition-opacity" :class="vizLoading ? '' : 'opacity-0 pointer-events-none'">
            <div class="w-7 h-7 rounded-full border-[3px] border-[rgba(90,100,160,0.15)] border-t-[#5868a8] animate-spin"></div>
            <div class="text-xs text-[#8a8aaa] font-sans">{{ t('openclaw_viz_loading') }}</div>
          </div>
        </div>
      </div>

    </div>

    <div class="frame-b"></div>

    <!-- 新建浮层 -->
    <div class="fixed inset-0 z-20 bg-[rgba(30,20,12,0.7)] backdrop-blur-sm flex-col items-center justify-center p-5" :class="showNew ? 'flex' : 'hidden'" @click.self="showNew = false">
      <div class="info-card w-full max-w-[320px] rounded-sm p-[18px] relative shadow-xl">
        <div class="pin pin-r" style="right:16px;top:-3px"></div>
        <div class="text-center text-[15px] font-bold text-[#3a2810] mb-3.5">📌 {{ t('openclaw_new_task') }}</div>
        <div class="mb-2.5">
          <div class="text-[9px] text-[#9a8a68] tracking-wider font-bold mb-0.5">{{ t('openclaw_cron_name_ph') }}</div>
          <input class="nc-input w-full border-none outline-none bg-transparent border-b border-[rgba(160,140,100,0.3)] py-[7px] px-0.5 font-['Georgia',serif] text-[13px] text-[#3a2810]" v-model="addForm.name" :placeholder="t('openclaw_cron_name_ph')" />
        </div>
        <div class="mb-2.5">
          <div class="text-[9px] text-[#9a8a68] tracking-wider font-bold mb-0.5">调度方式</div>
          <div class="flex gap-1 mb-2.5">
            <div v-for="st in ['cron','every','at']" :key="st" class="sched-opt flex-1 py-1 rounded text-center cursor-pointer font-['Georgia',serif] text-[9px] font-bold" :class="{ sel: addForm.schedType === st }" @click="addForm.schedType = st">{{ t('openclaw_sched_' + st) }}</div>
          </div>
        </div>
        <div class="mb-2.5">
          <div class="text-[9px] text-[#9a8a68] tracking-wider font-bold mb-0.5">{{ t('openclaw_sched_label_' + addForm.schedType) }}</div>
          <input class="nc-input w-full border-none outline-none bg-transparent border-b border-[rgba(160,140,100,0.3)] py-[7px] px-0.5 font-['Georgia',serif] text-[13px] text-[#3a2810]" v-model="addForm.schedValue" :placeholder="t('openclaw_sched_' + addForm.schedType + '_ph')" />
        </div>
        <div class="mb-2.5">
          <div class="text-[9px] text-[#9a8a68] tracking-wider font-bold mb-0.5">{{ t('openclaw_cron_prompt_ph') }}</div>
          <textarea class="nc-ta w-full border-none outline-none resize-none bg-transparent border-b border-[rgba(160,140,100,0.3)] py-[7px] px-0.5 font-['Georgia',serif] text-[13px] text-[#3a2810] leading-relaxed" v-model="addForm.prompt" rows="3" :placeholder="t('openclaw_cron_prompt_ph')"></textarea>
        </div>
        <div class="flex gap-2 mt-3.5 justify-center">
          <button class="nc-btn nc-cancel px-5 py-[7px] rounded cursor-pointer font-['Georgia',serif] text-[11px] font-bold" @click="showNew = false">{{ t('openclaw_cancel') }}</button>
          <button class="nc-btn nc-create px-5 py-[7px] rounded cursor-pointer font-['Georgia',serif] text-[11px] font-bold text-white" @click="doAdd" :disabled="addBusy">{{ t('openclaw_pin_it') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
const API = '/aios/apps/openclaw';

const status = ref({ online: false, version: null, gateway: false });
const cronJobs = ref([]);
const cronError = ref('');
const currentView = ref('timetable');
const selectedJob = ref(null);
const selectedJobIdx = ref(0);
const runs = ref([]);
const runsLoading = ref(false);
const expandedRun = ref(-1);
const vizLoading = ref(false);
const showNew = ref(false);
const addBusy = ref(false);
const addForm = ref({ name: '', schedType: 'cron', schedValue: '', prompt: '' });
const timetableRef = ref(null);
const nowRef = ref(null);
const vizFrameRef = ref(null);

const EMOJIS = ['🐡', '🐠', '🐙', '🪼', '🦑', '🐚', '🦀', '🐳'];
const PINS = ['pin-r', 'pin-g', 'pin-b', 'pin-y'];
const STRIPES = ['s-coral', 's-teal', 's-plum', 's-amber'];

const jobEmoji = (idx) => EMOJIS[idx % EMOJIS.length];
const pinColor = (idx) => PINS[idx % PINS.length];
const stripeColor = (idx) => STRIPES[idx % STRIPES.length];

const scheduleText = (job) => {
  if (job.schedule?.cron) return `cron: ${job.schedule.cron}`;
  if (job.schedule?.every) return `every ${job.schedule.every}`;
  if (job.schedule?.at) return `at ${job.schedule.at}`;
  return job.id;
};

const nowLabel = computed(() => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
});

const pastSlots = computed(() => {
  return cronJobs.value
    .filter(j => j.lastRunAt)
    .map((j, i) => {
      const d = new Date(j.lastRunAt);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return { key: j.id + '-past', label: `${hh}:${mm}`, major: mm === '00', job: j, idx: i };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
});

const futureSlots = computed(() => {
  return cronJobs.value.map((j, i) => {
    let countdown = '';
    if (j.schedule?.every) countdown = `${j.schedule.every}后`;
    else if (j.schedule?.at) countdown = j.schedule.at;
    else countdown = '下次执行';
    const nextHour = ((new Date().getHours() + 1 + i) % 24);
    const label = `${String(nextHour).padStart(2, '0')}:00`;
    return { key: j.id + '-future', label, major: true, job: j, idx: i, countdown };
  });
});

const loadStatus = async () => {
  try {
    const res = await fetch(`${API}/status`);
    status.value = await res.json();
  } catch { status.value = { online: false, version: null, gateway: false }; }
};

const loadCron = async () => {
  cronError.value = '';
  try {
    const res = await fetch(`${API}/cron/list`);
    const data = await res.json();
    if (!data.success) { cronError.value = data.message; return; }
    cronJobs.value = Array.isArray(data.jobs) ? data.jobs : [];
  } catch (e) { cronError.value = e.message; }
};

const openDetail = async (job) => {
  selectedJob.value = job;
  selectedJobIdx.value = cronJobs.value.indexOf(job);
  expandedRun.value = -1;
  currentView.value = 'detail';
  runsLoading.value = true;
  runs.value = [];
  try {
    const res = await fetch(`${API}/cron/runs?jobId=${encodeURIComponent(job.id)}`);
    const data = await res.json();
    if (data.success) runs.value = Array.isArray(data.runs) ? data.runs : [];
  } catch { /* no runs */ }
  runsLoading.value = false;
};

const doRun = async (jobId) => {
  try {
    await fetch(`${API}/cron/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
    if (selectedJob.value) await openDetail(selectedJob.value);
  } catch (e) { cronError.value = e.message; }
};

const doDelete = async (jobId) => {
  try {
    await fetch(`${API}/cron/delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
    currentView.value = 'timetable';
    await loadCron();
  } catch (e) { cronError.value = e.message; }
};

const doAdd = async () => {
  if (!addForm.value.name || !addForm.value.prompt) return;
  addBusy.value = true;
  const schedule = {};
  schedule[addForm.value.schedType] = addForm.value.schedValue;
  try {
    const res = await fetch(`${API}/cron/add`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addForm.value.name, schedule, prompt: addForm.value.prompt })
    });
    const data = await res.json();
    if (data.success) {
      showNew.value = false;
      addForm.value = { name: '', schedType: 'cron', schedValue: '', prompt: '' };
      await loadCron();
    }
  } catch (e) { cronError.value = e.message; }
  addBusy.value = false;
};

const openViz = (run) => {
  vizLoading.value = true;
  currentView.value = 'viz';
  nextTick(() => {
    const content = run.output || run.result || '';
    const html = `<!DOCTYPE html><html><head><style>*{margin:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;padding:16px;background:#f8f9fa;color:#1a1a2e;font-size:13px;line-height:1.7}pre{white-space:pre-wrap;word-break:break-all}</style></head><body><pre>${content}</pre></body></html>`;
    if (vizFrameRef.value) vizFrameRef.value.srcdoc = html;
    setTimeout(() => { vizLoading.value = false; }, 500);
  });
};

onMounted(async () => {
  await loadStatus();
  await loadCron();
  nextTick(() => {
    if (nowRef.value) nowRef.value.scrollIntoView({ block: 'center' });
  });
});
</script>

<style scoped>
/* === 纯拟物效果：复杂渐变纹理、多层 shadow、伪元素、radial-gradient === */

/* 软木板纹理 */
.cork-bg {
  position:absolute; inset:0; z-index:0;
  background:
    repeating-conic-gradient(rgba(160,120,70,0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 4px),
    repeating-linear-gradient(85deg, rgba(120,80,40,0.02) 0px, transparent 1px, transparent 6px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
  box-shadow:inset 0 0 80px rgba(0,0,0,0.3);
}
.page-bg {
  background:
    repeating-conic-gradient(rgba(160,120,70,0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 4px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
}

/* 木框渐变 */
.frame-t { flex-shrink:0; height:6px; background:linear-gradient(180deg,#4a3420,#3a2414); box-shadow:0 3px 6px rgba(0,0,0,0.4); position:relative; z-index:5; }
.frame-b { flex-shrink:0; height:6px; background:linear-gradient(0deg,#4a3420,#3a2414); box-shadow:0 -3px 6px rgba(0,0,0,0.4); position:relative; z-index:5; }

/* 页面切换动画（cubic-bezier + translateX） */
.page { position:absolute; inset:0; display:flex; flex-direction:column; transition:transform 0.35s cubic-bezier(0.32,0.72,0,1), opacity 0.25s; overflow:hidden; }
.page.hide-left { transform:translateX(-30%); opacity:0; pointer-events:none; }
.page.hide-right { transform:translateX(100%); opacity:0; pointer-events:none; }
.page.active { transform:translateX(0); opacity:1; }

/* 黄铜徽章 radial-gradient + 多层 shadow */
.t-badge { background:radial-gradient(circle at 42% 38%, #c8a060, #8a6a30); box-shadow:inset 0 2px 3px rgba(255,220,150,0.3), 0 2px 4px rgba(0,0,0,0.4); }
.dot-on { background:radial-gradient(circle,#60b848,#388020); box-shadow:0 0 3px rgba(60,160,40,0.3); }
.dot-warn { background:radial-gradient(circle,#d4a840,#a08020); box-shadow:0 0 3px rgba(200,160,40,0.3); }

/* 黄铜/返回按钮 — 多层渐变 + text-shadow + 多层 shadow */
.brass-btn { background:linear-gradient(180deg,#c8a050,#a07828); text-shadow:0 1px 1px rgba(0,0,0,0.3); box-shadow:0 2px 0 #5a3a08, inset 0 1px 1px rgba(255,230,160,0.2); }
.brass-btn:active { transform:translateY(2px); box-shadow:0 0 0 #5a3a08; }
.back-btn { background:linear-gradient(180deg,#6a5838,#4a3820); box-shadow:0 2px 0 rgba(0,0,0,0.3); }
.back-btn:active { transform:translateY(2px); box-shadow:none; }

/* 时刻表刻度线 — 伪元素渐变 */
.scrollbar-hide::-webkit-scrollbar { display:none; }
.hour-row::before { content:''; position:absolute; top:0; left:52px; right:0; height:1px; background:linear-gradient(90deg, rgba(200,180,140,0.12), rgba(200,180,140,0.03)); }
.hour-row.major::before { background:linear-gradient(90deg, rgba(200,180,140,0.22), rgba(200,180,140,0.05)); }
.hour-label { text-shadow:0 1px 2px rgba(0,0,0,0.3); }
.hour-label.now-label { color:rgba(255,200,120,0.9) !important; text-shadow:0 0 8px rgba(255,180,80,0.3), 0 1px 2px rgba(0,0,0,0.4); }

/* NOW 线 — 伪元素 + radial-gradient 圆点 */
.now-line { position:relative; margin-left:52px; margin-right:16px; height:0; }
.now-line::before { content:''; position:absolute; top:-1px; left:0; right:0; height:2px; background:linear-gradient(90deg, rgba(180,80,40,0.5), rgba(180,80,40,0.1)); border-radius:1px; }
.now-line::after { content:''; position:absolute; top:-4px; left:-4px; width:8px; height:8px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #e08040, #b05020); border:1px solid #8a3818; box-shadow:0 0 6px rgba(200,80,40,0.3); }
.now-tag { position:absolute; top:-10px; left:14px; font-size:11px; font-weight:900; color:rgba(255,160,80,0.85); letter-spacing:2px; font-family:'Courier New',monospace; }

/* 索引卡片 — 三层渐变 + 三层 shadow */
.task-card { background:linear-gradient(180deg, #faf4e4, #f4ecda, #f0e6d0); box-shadow:1px 2px 4px rgba(0,0,0,0.18), 2px 3px 6px rgba(0,0,0,0.08), inset 0 0 20px rgba(200,180,140,0.12); transition:transform 0.1s; }
.task-card:active { transform:scale(0.98) rotate(0deg) !important; }
.task-card.past { opacity:0.5; }
.tilt-1{transform:rotate(-0.5deg)} .tilt-2{transform:rotate(0.4deg)} .tilt-3{transform:rotate(-0.3deg)} .tilt-4{transform:rotate(0.6deg)}

/* 图钉 — radial-gradient + 伪元素高光 */
.pin { position:absolute; top:-3px; right:12px; z-index:3; width:16px; height:16px; border-radius:50%; box-shadow:0 2px 3px rgba(0,0,0,0.3); }
.pin::after { content:''; position:absolute; top:3px; left:4px; width:4px; height:3px; border-radius:50%; background:rgba(255,255,255,0.35); }
.pin-r{background:radial-gradient(circle at 38% 32%,#ff8888,#c83030);border:1px solid #a02020}
.pin-g{background:radial-gradient(circle at 38% 32%,#88dd88,#30a030);border:1px solid #208020}
.pin-b{background:radial-gradient(circle at 38% 32%,#88aaff,#3050c8);border:1px solid #2040a0}
.pin-y{background:radial-gradient(circle at 38% 32%,#ffdd66,#c8a020);border:1px solid #a08010}

/* 彩条 — 渐变 */
.stripe{position:absolute;top:0;left:0;bottom:0;width:4px}
.s-coral{background:linear-gradient(180deg,#e06848,#c04830)} .s-teal{background:linear-gradient(180deg,#48a8a0,#308880)}
.s-plum{background:linear-gradient(180deg,#9068a8,#704888)} .s-amber{background:linear-gradient(180deg,#d0a040,#b08020)}

/* 胶带 — 半透明渐变 */
.tape { position:absolute; z-index:4; width:50px; height:14px; background:linear-gradient(180deg,rgba(255,240,180,0.65),rgba(230,210,140,0.45)); border:1px solid rgba(200,180,120,0.25); }

/* 信息卡 — 渐变 + shadow */
.info-card { background:linear-gradient(180deg,#faf4e4,#f0e6d0); box-shadow:1px 2px 4px rgba(0,0,0,0.15); }

/* 操作按钮 — 渐变 + shadow */
.ib { box-shadow:0 2px 0 rgba(0,0,0,0.12); }
.ib:active { transform:translateY(2px); box-shadow:none; }
.ib-run { background:linear-gradient(180deg,#5a9a50,#408838); border:1px solid #2a6a20; color:#d8f0d0; }
.ib-del { background:linear-gradient(180deg,#c0a090,#a88878); border:1px solid #8a6858; color:#fff; }

/* 执行记录卡 — 渐变 + shadow + 条件展开 */
.run-card { background:linear-gradient(180deg,#faf4e4,#f0e6d0); box-shadow:1px 1px 3px rgba(0,0,0,0.12); }
.run-card:active { transform:scale(0.98); }
.rd-ok { background:radial-gradient(circle at 35% 30%,#70d060,#388020); box-shadow:0 0 4px rgba(60,180,40,0.3); }
.rd-fail { background:radial-gradient(circle at 35% 30%,#e06050,#a02820); box-shadow:0 0 4px rgba(200,60,40,0.3); }
.run-card.open .run-arrow { transform:rotate(90deg); }
.run-detail { display:none; border-top:1px dashed rgba(160,140,100,0.2); padding:10px 12px; }
.run-card.open .run-detail { display:block; }
.run-output { background:rgba(0,0,0,0.03); border:1px solid rgba(160,140,100,0.12); }

/* 可视化按钮 — 渐变 + shadow */
.viz-btn { background:linear-gradient(180deg,#5868a8,#384888); border:1px solid #283868; color:#d0d8f0; box-shadow:0 2px 0 rgba(0,0,0,0.2); }
.viz-btn:active { transform:translateY(2px); box-shadow:none; }

/* 表单输入 — focus 变色 + placeholder italic */
.nc-input { border-bottom:1px solid rgba(160,140,100,0.3); }
.nc-input::placeholder { color:rgba(160,140,100,0.35); font-style:italic; }
.nc-input:focus { border-bottom-color:#a08030; }
.nc-ta { border-bottom:1px solid rgba(160,140,100,0.3); }
.nc-ta::placeholder { color:rgba(160,140,100,0.35); font-style:italic; }

/* 调度选择 — 渐变选中态 */
.sched-opt { background:rgba(0,0,0,0.03); border:1px solid rgba(160,140,100,0.15); color:#9a8a68; }
.sched-opt.sel { background:linear-gradient(180deg,#c8a050,#a07828); border-color:#7a5818; color:#fff; text-shadow:0 1px 1px rgba(0,0,0,0.2); }

/* 表单按钮 — 渐变 + shadow */
.nc-btn { box-shadow:0 2px 0 rgba(0,0,0,0.12); }
.nc-btn:active { transform:translateY(2px); box-shadow:none; }
.nc-cancel { background:linear-gradient(180deg,#e8e0d0,#d8d0c0); border:1px solid #c0b8a0; color:#8a7a58; }
.nc-create { background:linear-gradient(180deg,#c8a050,#a07828); border:1px solid #7a5818; text-shadow:0 1px 1px rgba(0,0,0,0.2); box-shadow:0 2px 0 #5a3a08; }
</style>
