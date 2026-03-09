<template>
  <div class="schedule-bg h-full flex justify-center p-4 font-['PingFang_SC','Microsoft_YaHei',sans-serif] text-[#3e3223]">
    <div class="machine-case w-full max-w-[480px] h-full flex flex-col p-5 relative">

      <div class="screw absolute top-3 left-3"></div>
      <div class="screw absolute top-3 right-3"></div>
      <div class="screw absolute bottom-3 left-3"></div>
      <div class="screw absolute bottom-3 right-3"></div>

      <!-- 顶栏 -->
      <div class="flex items-center gap-3 mb-4 border-b-2 border-[#d4ccc0] pb-3">
        <button class="metal-btn w-8 h-8 flex items-center justify-center text-sm shrink-0" @click="router.push('/schedule')">←</button>
        <div class="flex-1">
          <h1 class="text-base font-black text-[#3e3223] tracking-widest">{{ isEdit ? '编辑任务' : '安排新任务' }}</h1>
          <p class="text-[9px] text-[#8a7f72] font-bold uppercase tracking-wider">{{ isEdit ? 'EDIT TASK' : 'NEW SCHEDULED TASK' }}</p>
        </div>
      </div>

      <!-- 错误 -->
      <div v-if="error" class="mb-3 rounded bg-[#fdf5f0] border border-dashed border-[#e8b8a0] px-3 py-2 text-xs text-[#c06040]">{{ error }}</div>

      <!-- 表单 -->
      <div class="form-panel p-4 flex-1 overflow-y-auto space-y-4">

        <!-- 执行方式 -->
        <div>
          <div class="text-[9px] font-black text-[#8a7f72] tracking-widest mb-2">── 执行方式 ──────────</div>
          <div class="type-toggle">
            <div
              class="type-tab" :class="{ 'type-tab-active': form.execType === 'once' }"
              @click="form.execType = 'once'"
            >📅 定时执行<br><span class="text-[9px] font-normal opacity-70">指定时间点触发</span></div>
            <div
              class="type-tab" :class="{ 'type-tab-active': form.execType === 'repeat' }"
              @click="form.execType = 'repeat'"
            >🔄 循环执行<br><span class="text-[9px] font-normal opacity-70">Cron 规则重复</span></div>
          </div>
        </div>

        <!-- 任务名称 -->
        <div>
          <div class="text-[9px] font-black text-[#8a7f72] tracking-widest mb-2">── 任务名称 ──────────</div>
          <input v-model="form.name" type="text" class="etched-input w-full px-3 py-2 text-sm" placeholder="给任务起个名字...">
        </div>

        <!-- 任务指令 -->
        <div>
          <div class="text-[9px] font-black text-[#8a7f72] tracking-widest mb-2">── 任务指令 ──────────</div>
          <div class="blackboard p-3">
            <textarea v-model="form.prompt" rows="4" class="blackboard-input" placeholder="告诉 AI 需要做什么..."></textarea>
            <div class="text-[9px] text-[#7a7060] font-bold mt-1 border-t border-[#545040] pt-1">支持多行，可包含具体操作指令和输出要求</div>
          </div>
        </div>

        <!-- 定时模式：执行时间 -->
        <div v-if="form.execType === 'once'">
          <div class="text-[9px] font-black text-[#8a7f72] tracking-widest mb-2">── 执行时间 ──────────</div>
          <input v-model="form.runAt" type="datetime-local" class="etched-input w-full px-3 py-2 text-sm [color-scheme:light]">
          <div class="text-[10px] text-[#8a7f72] font-bold mt-1.5">选择一个未来的时间点，到时自动触发</div>
        </div>

        <!-- 循环模式：Cron -->
        <div v-if="form.execType === 'repeat'">
          <div class="text-[9px] font-black text-[#8a7f72] tracking-widest mb-2">── 执行规则 ──────────</div>
          <div class="grid grid-cols-3 gap-2 mb-3">
            <button
              v-for="p in cronPresets" :key="p.cron"
              class="preset-btn" :class="{ 'preset-btn-active': form.cron === p.cron }"
              @click="form.cron = p.cron"
            >{{ p.label }}<br><span class="cron-tag">{{ p.cron }}</span></button>
          </div>
          <div class="text-[9px] font-black text-[#8a7f72] tracking-widest mb-1.5">── 自定义表达式 ──</div>
          <input v-model="form.cron" type="text" class="etched-input w-full px-3 py-2 text-sm font-mono" placeholder="分 时 日 月 周">
          <div class="flex items-center gap-2 mt-1.5">
            <span class="text-[10px] text-[#8a7f72] font-bold">格式：分 时 日 月 周</span>
            <span v-if="cronDescription" class="bg-[#dcecd6] text-[#2a5a30] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#b8d8b0]">✓ {{ cronDescription }}</span>
          </div>
        </div>

        <!-- 结果 -->
        <div v-if="result" class="rounded-lg bg-[#dcecd6] border border-[#b8d8b0] p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-black text-[#2a5a30]">已安排</span>
            <span class="cron-tag">#{{ result.id }}</span>
          </div>
          <button class="text-[10px] font-bold text-[#2a5a30] underline decoration-dashed" @click="router.push('/schedule')">查看调度列表</button>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="mt-4">
        <button
          class="action-btn w-full py-2.5 text-sm tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="submitting"
          @click="submit"
        >{{ submitting ? '提交中...' : (isEdit ? '保存修改' : '安排任务') }}</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const cronPresets = [
  { label: '每天', cron: '0 8 * * *' },
  { label: '每周一', cron: '0 9 * * 1' },
  { label: '每月1号', cron: '0 8 1 * *' },
  { label: '每小时', cron: '0 * * * *' },
  { label: '每5分钟', cron: '*/5 * * * *' },
  { label: '工作日', cron: '0 9 * * 1-5' }
];

const cronDescMap = {
  '0 8 * * *': '每天8点',
  '0 9 * * 1': '每周一9点',
  '0 8 1 * *': '每月1号8点',
  '0 * * * *': '每小时整点',
  '*/5 * * * *': '每5分钟',
  '0 9 * * 1-5': '工作日9点'
};

const form = reactive({ execType: 'once', name: '', prompt: '', runAt: '', cron: '' });
const error = ref('');
const submitting = ref(false);
const isEdit = ref(false);
const editId = ref(null);
const result = ref(null);

const cronDescription = computed(() => cronDescMap[form.cron.trim()] || '');

const submit = async () => {
  error.value = '';
  result.value = null;
  if (!form.name.trim()) { error.value = '请填写任务名称'; return; }
  if (!form.prompt.trim()) { error.value = '请填写任务指令'; return; }
  if (form.execType === 'once' && !form.runAt) { error.value = '请选择执行时间'; return; }
  if (form.execType === 'repeat' && !form.cron.trim()) { error.value = '请填写 cron 表达式'; return; }

  submitting.value = true;
  try {
    const apiUrl = isEdit.value ? '/api/schedule/update' : '/api/schedule/create';
    const body = isEdit.value
      ? { id: editId.value, name: form.name.trim(), prompt: form.prompt.trim() }
      : { name: form.name.trim(), prompt: form.prompt.trim() };
    if (form.execType === 'once') { body.run_at = form.runAt.replace('T', ' '); body.cron = null; }
    else { body.cron = form.cron.trim(); body.run_at = null; }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
    result.value = { id: data.id };
  } catch (e) {
    error.value = e.message || '提交失败';
  } finally {
    submitting.value = false;
  }
};

const initFromRoute = async () => {
  error.value = '';
  result.value = null;
  const id = Number(route.params.id || 0);
  isEdit.value = id > 0;
  editId.value = id > 0 ? id : null;
  if (!isEdit.value) { Object.assign(form, { execType: 'once', name: '', prompt: '', runAt: '', cron: '' }); return; }
  try {
    const res = await fetch(`/api/schedule/detail?id=${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !data.schedule) throw new Error(data.message || `HTTP ${res.status}`);
    const s = data.schedule;
    form.name = s.name || '';
    form.prompt = s.prompt || '';
    if (s.cron) { form.execType = 'repeat'; form.cron = s.cron; form.runAt = ''; }
    else { form.execType = 'once'; form.runAt = (s.run_at || '').replace(' ', 'T').slice(0, 16); form.cron = ''; }
  } catch (e) { error.value = e.message || '加载失败'; }
};

watch(() => route.params.id, () => initFromRoute(), { immediate: true });
</script>

<style scoped>
.schedule-bg {
  background-color: #c8bcac;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px);
}
.machine-case {
  background-color: #eeebe6; border-radius: 16px; border: 1px solid #ddd6ce;
  box-shadow: inset 0 4px 6px rgba(255,255,255,0.9), inset 0 -4px 6px rgba(0,0,0,0.06), 0 20px 40px rgba(80,60,40,0.25), 0 6px 12px rgba(80,60,40,0.12);
}
.form-panel {
  background-color: #e2dbd2; border: 2px solid #b4a898; border-radius: 8px;
  box-shadow: inset 0 4px 8px rgba(0,0,0,0.12), 0 2px 0 rgba(255,255,255,0.8);
  background-image: linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 10px 10px;
}
.blackboard {
  background-color: #383330; border: 3px solid #9a9080; border-radius: 6px;
  box-shadow: inset 0 4px 10px rgba(0,0,0,0.6), 0 3px 0 rgba(255,255,255,0.6);
}
.blackboard-input {
  background: transparent; color: #e0d49c; font-family: 'PingFang SC', serif;
  font-size: 13px; line-height: 1.7; border: none; outline: none; resize: none; width: 100%;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
.blackboard-input::placeholder { color: #7a7060; }
.etched-input {
  background-color: #f4f0ea; border: 1px solid #bab0a0; border-radius: 4px; color: #3e3223; outline: none;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.12);
}
.etched-input:focus { border-color: #a09080; background-color: #fff; }
.type-toggle {
  display: flex; background-color: #c8bfb2; border: 2px solid #a09080; border-radius: 6px; padding: 3px; gap: 3px;
  box-shadow: inset 0 3px 6px rgba(0,0,0,0.2), 0 2px 0 rgba(255,255,255,0.7);
}
.type-tab {
  flex: 1; padding: 6px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;
  text-align: center; cursor: pointer; transition: all 0.15s; color: #7a6f62;
}
.type-tab-active {
  background: linear-gradient(180deg, #f0ece4 0%, #ddd4c4 100%); color: #3e3223;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 0 #a09080;
}
.type-tab:not(.type-tab-active):hover { background: rgba(255,255,255,0.2); }
.preset-btn {
  background: linear-gradient(180deg, #e8e2da 0%, #cec6ba 100%);
  border: 1px solid #a89888; border-radius: 4px; font-size: 10px; font-weight: 800;
  color: #4a4136; cursor: pointer; text-align: center; padding: 6px 4px; transition: all 0.1s;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 0 #8a8070;
}
.preset-btn:active, .preset-btn-active {
  transform: translateY(2px); border-color: #7a5a30;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 0 0 #8a8070;
  background: linear-gradient(180deg, #d4cec6 0%, #bab2a6 100%);
}
.metal-btn {
  background: linear-gradient(180deg, #e6e0d8 0%, #c2b8ac 100%);
  border: 1px solid #9c9288; border-radius: 4px; color: #4a4136; font-weight: 800; cursor: pointer; transition: all 0.1s;
  text-shadow: 0 1px 0 rgba(255,255,255,0.5);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 3px 0 #8a8076, 0 4px 6px rgba(0,0,0,0.18);
}
.metal-btn:active { transform: translateY(3px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 0 0, 0 1px 2px rgba(0,0,0,0.15); }
.action-btn {
  background: linear-gradient(180deg, #d05a38 0%, #a83c20 100%);
  border: 2px solid #7a2810; border-radius: 8px; color: #fdf0e8;
  font-weight: 900; cursor: pointer; letter-spacing: 0.1em; transition: all 0.1s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.2), 0 5px 0 #6a1e08, 0 7px 10px rgba(0,0,0,0.3);
}
.action-btn:active { transform: translateY(5px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 #6a1e08, 0 2px 4px rgba(0,0,0,0.3); }
.screw {
  width: 10px; height: 10px; border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #d8d0c4, #a09080);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.5);
}
.screw::after {
  content: '—'; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%) rotate(45deg); font-size: 6px; color: #786858; line-height: 1;
}
.cron-tag {
  font-family: 'Courier New', monospace; background: #3b3631; color: #d4c88a;
  border-radius: 3px; padding: 1px 5px; font-size: 10px; font-weight: bold;
  border: 1px solid #5a5040; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
}
::-webkit-scrollbar { display: none; }
</style>
