<template>
  <div class="oc-root">
    <div class="cork-bg"></div>
    <div class="frame-t"></div>

    <div class="pages">

      <!-- 时刻表页 -->
      <div class="page" :class="currentView === 'timetable' ? 'active' : 'hide-left'">
        <div class="topbar">
          <div class="t-badge">🦞</div>
          <div class="t-info">
            <div class="t-name">OpenClaw</div>
            <div class="t-sub">
              <span class="t-dot" :class="status.online ? (status.gateway ? 'dot-on' : 'dot-warn') : 'dot-off'"></span>
              <span class="t-ver">{{ status.online ? (status.gateway ? t('openclaw_online') : t('openclaw_no_gateway')) : t('openclaw_offline') }}{{ status.version ? ' · ' + status.version : '' }}</span>
            </div>
          </div>
          <button class="brass-btn" @click="showNew = true">{{ t('openclaw_new_task') }}</button>
        </div>

        <div class="timetable" ref="timetableRef">
          <template v-if="!cronJobs.length && !cronError">
            <div class="empty-state">{{ t('openclaw_cron_empty') }}</div>
          </template>
          <template v-else>
            <!-- 已执行区 -->
            <template v-for="slot in pastSlots" :key="'past-'+slot.key">
              <div class="hour-row" :class="{ major: slot.major }">
                <div class="hour-label" style="color:rgba(255,230,180,0.35);">{{ slot.label }}</div>
                <div v-if="slot.job" class="task-card past" :class="'tilt-'+((slot.idx%4)+1)" @click="openDetail(slot.job)">
                  <div class="pin" :class="pinColor(slot.idx)"></div>
                  <div class="stripe" :class="stripeColor(slot.idx)"></div>
                  <div class="tc-body">
                    <div class="tc-top">
                      <span class="tc-emoji">{{ jobEmoji(slot.idx) }}</span>
                      <div class="tc-info">
                        <div class="tc-name">{{ slot.job.name || slot.job.id }}</div>
                        <div class="tc-cron">{{ scheduleText(slot.job) }} · {{ t('openclaw_executed') }}</div>
                      </div>
                    </div>
                    <div v-if="slot.job.message" class="tc-prompt">{{ slot.job.message }}</div>
                  </div>
                </div>
              </div>
            </template>

            <!-- NOW 标记 -->
            <div class="hour-row major" ref="nowRef">
              <div class="hour-label now-label">{{ nowLabel }}</div>
            </div>
            <div class="now-line"><span class="now-tag">{{ t('openclaw_now') }}</span></div>

            <!-- 即将执行区 -->
            <template v-for="slot in futureSlots" :key="'future-'+slot.key">
              <div class="hour-row" :class="{ major: slot.major }">
                <div class="hour-label" style="color:rgba(180,230,150,0.7);">{{ slot.label }}</div>
                <div v-if="slot.job" class="task-card" :class="'tilt-'+((slot.idx%4)+1)" @click="openDetail(slot.job)">
                  <div class="pin" :class="pinColor(slot.idx)"></div>
                  <div class="stripe" :class="stripeColor(slot.idx)"></div>
                  <div v-if="slot.idx % 3 === 0" class="tape" style="top:4px;left:-6px;transform:rotate(-10deg);"></div>
                  <div class="tc-body">
                    <div class="tc-top">
                      <span class="tc-emoji">{{ jobEmoji(slot.idx) }}</span>
                      <div class="tc-info">
                        <div class="tc-name">{{ slot.job.name || slot.job.id }}</div>
                        <div class="tc-cron">{{ scheduleText(slot.job) }} · {{ slot.countdown }}</div>
                      </div>
                    </div>
                    <div v-if="slot.job.message" class="tc-prompt">{{ slot.job.message }}</div>
                  </div>
                </div>
              </div>
            </template>
          </template>
          <div style="height:40px;"></div>
        </div>
      </div>

      <!-- 详情页 -->
      <div class="page page-bg" :class="currentView === 'detail' ? 'active' : (currentView === 'viz' ? 'hide-left' : 'hide-right')" style="z-index:3;">
        <div class="topbar">
          <button class="back-btn" @click="currentView = 'timetable'">{{ t('openclaw_back') }}</button>
          <div class="page-title">{{ selectedJob?.name || '' }}</div>
        </div>
        <div class="detail-scroll">
          <div v-if="selectedJob" class="info-card">
            <div class="info-row">
              <span class="info-emoji">{{ jobEmoji(selectedJobIdx) }}</span>
              <div>
                <div class="info-name">{{ selectedJob.name || selectedJob.id }}</div>
                <div class="info-cron">{{ scheduleText(selectedJob) }}</div>
              </div>
            </div>
            <div v-if="selectedJob.message" class="info-prompt">{{ selectedJob.message }}</div>
            <div class="info-actions">
              <button class="ib ib-run" @click="doRun(selectedJob.id)">▶ {{ t('openclaw_run') }}</button>
              <button class="ib ib-del" @click="doDelete(selectedJob.id)">{{ t('openclaw_delete') }}</button>
            </div>
          </div>

          <div class="runs-label">{{ t('openclaw_runs_label') }}</div>
          <div v-if="runsLoading" class="empty-state">...</div>
          <div v-else-if="!runs.length" class="empty-state">{{ t('openclaw_no_runs') }}</div>
          <div v-for="(r, ri) in runs" :key="ri" class="run-card" :class="{ open: expandedRun === ri }" @click="expandedRun = expandedRun === ri ? -1 : ri">
            <div class="run-top">
              <div class="run-dot" :class="r.ok !== false ? 'rd-ok' : 'rd-fail'"></div>
              <div class="run-info">
                <div class="run-time">{{ r.time || r.startedAt || '—' }}</div>
                <div class="run-dur">{{ t('openclaw_run_duration') }} {{ r.duration || '—' }}</div>
              </div>
              <div class="run-status" :class="r.ok !== false ? 'rs-ok' : 'rs-fail'">{{ r.ok !== false ? t('openclaw_run_ok') : t('openclaw_run_fail') }}</div>
              <div class="run-arrow">▸</div>
            </div>
            <div class="run-detail" @click.stop>
              <div class="run-output">{{ r.output || r.result || '—' }}</div>
              <div v-if="r.ok !== false" class="run-btns">
                <button class="viz-btn" @click="openViz(r)">{{ t('openclaw_visualize') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 可视化页 -->
      <div class="page page-bg" :class="currentView === 'viz' ? 'active' : 'hide-right'" style="z-index:4;">
        <div class="topbar">
          <button class="back-btn" @click="currentView = 'detail'">{{ t('openclaw_back') }}</button>
          <div class="page-title">{{ t('openclaw_visualize') }}</div>
        </div>
        <div class="viz-wrap">
          <iframe class="viz-iframe" ref="vizFrameRef"></iframe>
          <div class="viz-loading" :class="{ hide: !vizLoading }">
            <div class="viz-spinner"></div>
            <div class="viz-text">{{ t('openclaw_viz_loading') }}</div>
          </div>
        </div>
      </div>

    </div>

    <div class="frame-b"></div>

    <!-- 新建浮层 -->
    <div class="new-ov" :class="{ show: showNew }" @click.self="showNew = false">
      <div class="new-card">
        <div class="pin pin-r" style="right:16px;top:-3px;"></div>
        <div class="nc-title">📌 {{ t('openclaw_new_task') }}</div>
        <div class="nc-field">
          <div class="nc-label">{{ t('openclaw_cron_name_ph') }}</div>
          <input class="nc-input" v-model="addForm.name" :placeholder="t('openclaw_cron_name_ph')" />
        </div>
        <div class="nc-field">
          <div class="nc-label">调度方式</div>
          <div class="sched-row">
            <div class="sched-opt" :class="{ sel: addForm.schedType === 'cron' }" @click="addForm.schedType = 'cron'">{{ t('openclaw_sched_cron') }}</div>
            <div class="sched-opt" :class="{ sel: addForm.schedType === 'every' }" @click="addForm.schedType = 'every'">{{ t('openclaw_sched_every') }}</div>
            <div class="sched-opt" :class="{ sel: addForm.schedType === 'at' }" @click="addForm.schedType = 'at'">{{ t('openclaw_sched_at') }}</div>
          </div>
        </div>
        <div class="nc-field">
          <div class="nc-label">{{ t('openclaw_sched_label_' + addForm.schedType) }}</div>
          <input class="nc-input" v-model="addForm.schedValue" :placeholder="t('openclaw_sched_' + addForm.schedType + '_ph')" />
        </div>
        <div class="nc-field">
          <div class="nc-label">{{ t('openclaw_cron_prompt_ph') }}</div>
          <textarea class="nc-ta" v-model="addForm.prompt" rows="3" :placeholder="t('openclaw_cron_prompt_ph')"></textarea>
        </div>
        <div class="nc-actions">
          <button class="nc-btn nc-cancel" @click="showNew = false">{{ t('openclaw_cancel') }}</button>
          <button class="nc-btn nc-create" @click="doAdd" :disabled="addBusy">{{ t('openclaw_pin_it') }}</button>
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
    if (j.schedule?.every) {
      countdown = `${j.schedule.every}后`;
    } else if (j.schedule?.at) {
      countdown = j.schedule.at;
    } else {
      countdown = '下次执行';
    }
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
  } catch { /* no runs available */ }
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
.oc-root {
  display:flex; flex-direction:column; height:100%; overflow:hidden;
  font-family:'Georgia','PingFang SC',serif;
  background:#2a1e14;
  position:relative;
}

.cork-bg {
  position:absolute; inset:0; z-index:0;
  background:
    repeating-conic-gradient(rgba(160,120,70,0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 4px),
    repeating-linear-gradient(85deg, rgba(120,80,40,0.02) 0px, transparent 1px, transparent 6px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
  box-shadow:inset 0 0 80px rgba(0,0,0,0.3);
}

.frame-t { flex-shrink:0; height:6px; background:linear-gradient(180deg,#4a3420,#3a2414); box-shadow:0 3px 6px rgba(0,0,0,0.4); position:relative; z-index:5; }
.frame-b { flex-shrink:0; height:6px; background:linear-gradient(0deg,#4a3420,#3a2414); box-shadow:0 -3px 6px rgba(0,0,0,0.4); position:relative; z-index:5; }

.pages { flex:1; min-height:0; position:relative; z-index:2; overflow:hidden; }
.page {
  position:absolute; inset:0; display:flex; flex-direction:column;
  transition:transform 0.35s cubic-bezier(0.32,0.72,0,1), opacity 0.25s;
  overflow:hidden; background:transparent;
}
.page.hide-left { transform:translateX(-30%); opacity:0; pointer-events:none; }
.page.hide-right { transform:translateX(100%); opacity:0; pointer-events:none; }
.page.active { transform:translateX(0); opacity:1; pointer-events:auto; }
.page-bg {
  background:
    repeating-conic-gradient(rgba(160,120,70,0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 4px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
}

/* 顶栏 */
.topbar { flex-shrink:0; padding:8px 16px 6px; display:flex; align-items:center; gap:10px; }
.t-badge {
  width:34px; height:34px; border-radius:50%;
  background:radial-gradient(circle at 42% 38%, #c8a060, #8a6a30);
  border:2px solid #6a4a18;
  box-shadow:inset 0 2px 3px rgba(255,220,150,0.3), 0 2px 4px rgba(0,0,0,0.4);
  display:flex; align-items:center; justify-content:center; font-size:16px;
}
.t-info { flex:1; }
.t-name { font-size:14px; font-weight:700; color:#3a2810; text-shadow:0 1px 0 rgba(255,220,150,0.12); }
.t-sub { display:flex; align-items:center; gap:4px; margin-top:1px; }
.t-dot { width:4px; height:4px; border-radius:50%; }
.dot-on { background:radial-gradient(circle,#60b848,#388020); box-shadow:0 0 3px rgba(60,160,40,0.3); }
.dot-warn { background:radial-gradient(circle,#d4a840,#a08020); box-shadow:0 0 3px rgba(200,160,40,0.3); }
.dot-off { background:#6a4a3a; }
.t-ver { font-size:8px; color:rgba(60,40,20,0.4); }
.brass-btn {
  padding:5px 12px; border-radius:5px; cursor:pointer;
  font-family:'Georgia',serif; font-size:9px; font-weight:700; letter-spacing:1px;
  background:linear-gradient(180deg,#c8a050,#a07828);
  border:1px solid #7a5818; color:#fff;
  text-shadow:0 1px 1px rgba(0,0,0,0.3);
  box-shadow:0 2px 0 #5a3a08, inset 0 1px 1px rgba(255,230,160,0.2);
}
.brass-btn:active { transform:translateY(2px); box-shadow:0 0 0 #5a3a08; }
.back-btn {
  padding:5px 12px; border-radius:5px; cursor:pointer;
  font-family:'Georgia',serif; font-size:10px; font-weight:700;
  background:linear-gradient(180deg,#6a5838,#4a3820);
  border:1px solid #3a2810; color:rgba(255,220,150,0.6);
  box-shadow:0 2px 0 rgba(0,0,0,0.3);
}
.back-btn:active { transform:translateY(2px); box-shadow:none; }
.page-title { flex:1; font-size:13px; font-weight:700; color:#3a2810; text-shadow:0 1px 0 rgba(255,220,150,0.12); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

/* 时刻表 */
.timetable { flex:1; min-height:0; overflow-y:auto; padding:0 0 30px; -webkit-overflow-scrolling:touch; }
.timetable::-webkit-scrollbar { display:none; }
.hour-row { position:relative; min-height:48px; padding-left:58px; padding-right:16px; }
.hour-row::before { content:''; position:absolute; top:0; left:52px; right:0; height:1px; background:linear-gradient(90deg, rgba(200,180,140,0.12), rgba(200,180,140,0.03)); }
.hour-row.major::before { background:linear-gradient(90deg, rgba(200,180,140,0.22), rgba(200,180,140,0.05)); }
.hour-label { position:absolute; top:-2px; left:6px; width:42px; text-align:right; font-size:13px; font-weight:800; color:rgba(255,230,180,0.35); letter-spacing:0.5px; font-family:'Courier New',monospace; line-height:1; text-shadow:0 1px 2px rgba(0,0,0,0.3); }
.hour-label.now-label { color:rgba(255,200,120,0.9); font-weight:900; font-size:14px; text-shadow:0 0 8px rgba(255,180,80,0.3), 0 1px 2px rgba(0,0,0,0.4); }

.now-line { position:relative; margin-left:52px; margin-right:16px; height:0; }
.now-line::before { content:''; position:absolute; top:-1px; left:0; right:0; height:2px; background:linear-gradient(90deg, rgba(180,80,40,0.5), rgba(180,80,40,0.1)); border-radius:1px; }
.now-line::after { content:''; position:absolute; top:-4px; left:-4px; width:8px; height:8px; border-radius:50%; background:radial-gradient(circle at 38% 32%, #e08040, #b05020); border:1px solid #8a3818; box-shadow:0 0 6px rgba(200,80,40,0.3); }
.now-tag { position:absolute; top:-10px; left:14px; font-size:11px; font-weight:900; color:rgba(255,160,80,0.85); letter-spacing:2px; font-family:'Courier New',monospace; }

/* 卡片 */
.task-card {
  position:relative; margin:6px 0 10px;
  background:linear-gradient(180deg, #faf4e4, #f4ecda, #f0e6d0);
  border-radius:2px; cursor:pointer; transition:transform 0.1s; overflow:hidden;
  box-shadow:1px 2px 4px rgba(0,0,0,0.18), 2px 3px 6px rgba(0,0,0,0.08), inset 0 0 20px rgba(200,180,140,0.12);
}
.task-card:active { transform:scale(0.98) rotate(0deg) !important; }
.task-card.past { opacity:0.5; }
.tilt-1{transform:rotate(-0.5deg);} .tilt-2{transform:rotate(0.4deg);} .tilt-3{transform:rotate(-0.3deg);} .tilt-4{transform:rotate(0.6deg);}

.pin { position:absolute; top:-3px; right:12px; z-index:3; width:16px; height:16px; border-radius:50%; box-shadow:0 2px 3px rgba(0,0,0,0.3); }
.pin::after { content:''; position:absolute; top:3px; left:4px; width:4px; height:3px; border-radius:50%; background:rgba(255,255,255,0.35); }
.pin-r{background:radial-gradient(circle at 38% 32%,#ff8888,#c83030);border:1px solid #a02020;}
.pin-g{background:radial-gradient(circle at 38% 32%,#88dd88,#30a030);border:1px solid #208020;}
.pin-b{background:radial-gradient(circle at 38% 32%,#88aaff,#3050c8);border:1px solid #2040a0;}
.pin-y{background:radial-gradient(circle at 38% 32%,#ffdd66,#c8a020);border:1px solid #a08010;}

.stripe{position:absolute;top:0;left:0;bottom:0;width:4px;}
.s-coral{background:linear-gradient(180deg,#e06848,#c04830);} .s-teal{background:linear-gradient(180deg,#48a8a0,#308880);}
.s-plum{background:linear-gradient(180deg,#9068a8,#704888);} .s-amber{background:linear-gradient(180deg,#d0a040,#b08020);}

.tape { position:absolute; z-index:4; width:50px; height:14px; background:linear-gradient(180deg,rgba(255,240,180,0.65),rgba(230,210,140,0.45)); border:1px solid rgba(200,180,120,0.25); }

.tc-body{padding:10px 12px 10px 14px;}
.tc-top{display:flex;align-items:center;gap:8px;}
.tc-emoji{font-size:20px;flex-shrink:0;}
.tc-info{flex:1;min-width:0;}
.tc-name{font-size:14px;font-weight:700;color:#3a2810;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.tc-cron{font-size:9px;color:#9a8a68;font-family:'Courier New',monospace;margin-top:1px;}
.tc-prompt{margin-top:6px;font-size:11px;line-height:1.55;color:#6a5838;font-style:italic;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}

.empty-state { text-align:center; padding:40px 0; font-size:12px; color:rgba(255,230,180,0.3); }

/* 详情页 */
.detail-scroll { flex:1; min-height:0; overflow-y:auto; padding:0 16px 24px; -webkit-overflow-scrolling:touch; }
.detail-scroll::-webkit-scrollbar { display:none; }

.info-card { background:linear-gradient(180deg,#faf4e4,#f0e6d0); border-radius:2px; padding:14px; box-shadow:1px 2px 4px rgba(0,0,0,0.15); margin-bottom:14px; }
.info-row { display:flex; align-items:center; gap:10px; margin-bottom:6px; }
.info-emoji { font-size:26px; }
.info-name { font-size:16px; font-weight:700; color:#3a2810; }
.info-cron { font-size:11px; color:#9a8a68; font-family:'Courier New',monospace; margin-top:2px; }
.info-prompt { font-size:12px; line-height:1.65; color:#5a4830; font-style:italic; padding:8px 0; border-top:1px dashed rgba(160,140,100,0.2); margin-top:6px; }
.info-actions { display:flex; gap:6px; margin-top:10px; padding-top:8px; border-top:1px dashed rgba(160,140,100,0.2); }
.ib { padding:6px 14px; border-radius:5px; cursor:pointer; font-family:'Georgia',serif; font-size:9px; font-weight:700; box-shadow:0 2px 0 rgba(0,0,0,0.12); }
.ib:active { transform:translateY(2px); box-shadow:none; }
.ib-run { background:linear-gradient(180deg,#5a9a50,#408838); border:1px solid #2a6a20; color:#d8f0d0; }
.ib-del { background:linear-gradient(180deg,#c0a090,#a88878); border:1px solid #8a6858; color:#fff; }

.runs-label { font-size:10px; font-weight:700; color:rgba(255,230,180,0.5); letter-spacing:2px; margin-bottom:8px; text-shadow:0 1px 2px rgba(0,0,0,0.3); }

.run-card { background:linear-gradient(180deg,#faf4e4,#f0e6d0); border-radius:2px; margin-bottom:8px; overflow:hidden; cursor:pointer; box-shadow:1px 1px 3px rgba(0,0,0,0.12); }
.run-card:active { transform:scale(0.98); }
.run-top { padding:10px 12px; display:flex; align-items:center; gap:8px; }
.run-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.rd-ok { background:radial-gradient(circle at 35% 30%,#70d060,#388020); box-shadow:0 0 4px rgba(60,180,40,0.3); }
.rd-fail { background:radial-gradient(circle at 35% 30%,#e06050,#a02820); box-shadow:0 0 4px rgba(200,60,40,0.3); }
.run-info { flex:1; min-width:0; }
.run-time { font-size:12px; font-weight:600; color:#3a2810; }
.run-dur { font-size:9px; color:#9a8a68; margin-top:1px; }
.run-status { flex-shrink:0; font-size:9px; font-weight:700; }
.rs-ok { color:#4a8a40; } .rs-fail { color:#c05040; }
.run-arrow { flex-shrink:0; font-size:10px; color:#c0b090; transition:transform 0.2s; }
.run-card.open .run-arrow { transform:rotate(90deg); }
.run-detail { display:none; border-top:1px dashed rgba(160,140,100,0.2); padding:10px 12px; }
.run-card.open .run-detail { display:block; }
.run-output { font-family:'Courier New',monospace; font-size:10px; line-height:1.6; color:#4a3a20; background:rgba(0,0,0,0.03); border:1px solid rgba(160,140,100,0.12); border-radius:4px; padding:8px 10px; max-height:140px; overflow-y:auto; white-space:pre-wrap; word-break:break-all; }
.run-output::-webkit-scrollbar { display:none; }
.run-btns { display:flex; gap:6px; margin-top:8px; }
.viz-btn { padding:5px 14px; border-radius:5px; cursor:pointer; font-family:'Georgia',serif; font-size:9px; font-weight:700; background:linear-gradient(180deg,#5868a8,#384888); border:1px solid #283868; color:#d0d8f0; box-shadow:0 2px 0 rgba(0,0,0,0.2); }
.viz-btn:active { transform:translateY(2px); box-shadow:none; }

/* 可视化 */
.viz-wrap { flex:1; min-height:0; margin:0 16px 16px; border-radius:4px; overflow:hidden; background:#fff; position:relative; box-shadow:1px 2px 6px rgba(0,0,0,0.2); }
.viz-iframe { width:100%; height:100%; border:none; }
.viz-loading { position:absolute; inset:0; background:rgba(255,255,255,0.92); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; transition:opacity 0.3s; }
.viz-loading.hide { opacity:0; pointer-events:none; }
.viz-spinner { width:28px; height:28px; border-radius:50%; border:3px solid rgba(90,100,160,0.15); border-top-color:#5868a8; animation:spin 0.8s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }
.viz-text { font-size:12px; color:#8a8aaa; font-family:-apple-system,sans-serif; }

/* 新建 */
.new-ov { display:none; position:absolute; inset:0; z-index:20; background:rgba(30,20,12,0.7); backdrop-filter:blur(4px); flex-direction:column; align-items:center; justify-content:center; padding:20px; }
.new-ov.show { display:flex; }
.new-card { width:100%; max-width:320px; background:linear-gradient(180deg,#faf4e4,#f0e6d0); border-radius:2px; padding:18px; box-shadow:2px 4px 12px rgba(0,0,0,0.3); position:relative; }
.nc-title { text-align:center; font-size:15px; font-weight:700; color:#3a2810; margin-bottom:14px; }
.nc-field { margin-bottom:10px; }
.nc-label { font-size:9px; color:#9a8a68; letter-spacing:1px; font-weight:700; margin-bottom:3px; }
.nc-input { width:100%; border:none; outline:none; background:transparent; border-bottom:1px solid rgba(160,140,100,0.3); padding:7px 2px; font-family:'Georgia',serif; font-size:13px; color:#3a2810; }
.nc-input::placeholder { color:rgba(160,140,100,0.35); font-style:italic; }
.nc-input:focus { border-bottom-color:#a08030; }
.nc-ta { width:100%; border:none; outline:none; resize:none; background:transparent; border-bottom:1px solid rgba(160,140,100,0.3); padding:7px 2px; font-family:'Georgia',serif; font-size:13px; color:#3a2810; line-height:1.6; }
.nc-ta::placeholder { color:rgba(160,140,100,0.35); font-style:italic; }
.sched-row { display:flex; gap:4px; margin-bottom:10px; }
.sched-opt { flex:1; padding:5px 0; border-radius:4px; cursor:pointer; text-align:center; font-family:'Georgia',serif; font-size:9px; font-weight:700; background:rgba(0,0,0,0.03); border:1px solid rgba(160,140,100,0.15); color:#9a8a68; }
.sched-opt.sel { background:linear-gradient(180deg,#c8a050,#a07828); border-color:#7a5818; color:#fff; text-shadow:0 1px 1px rgba(0,0,0,0.2); }
.nc-actions { display:flex; gap:8px; margin-top:14px; justify-content:center; }
.nc-btn { padding:7px 20px; border-radius:5px; cursor:pointer; font-family:'Georgia',serif; font-size:11px; font-weight:700; box-shadow:0 2px 0 rgba(0,0,0,0.12); }
.nc-btn:active { transform:translateY(2px); box-shadow:none; }
.nc-cancel { background:linear-gradient(180deg,#e8e0d0,#d8d0c0); border:1px solid #c0b8a0; color:#8a7a58; }
.nc-create { background:linear-gradient(180deg,#c8a050,#a07828); border:1px solid #7a5818; color:#fff; text-shadow:0 1px 1px rgba(0,0,0,0.2); box-shadow:0 2px 0 #5a3a08; }
</style>
