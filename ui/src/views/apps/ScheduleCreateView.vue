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
          <h1 class="text-xl font-bold text-[#3a2e20]">{{ isEdit ? '编辑定时任务' : '创建定时任务' }}</h1>
          <p class="text-xs text-[#9a8a74]">设定 AI 自动执行的周期性任务</p>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-4 py-2.5 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="space-y-4">

        <!-- 1. 执行方式 -->
        <div class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">执行方式</div>
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
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">基本信息</div>
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[#5a4a38]">任务名称</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="给任务起个名字，如：每日新闻早报"
                class="w-full rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:bg-white focus:ring-2 focus:ring-[#b0804020]"
              >
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-[#5a4a38]">任务提示词</label>
              <textarea
                v-model="form.prompt"
                rows="5"
                placeholder="告诉 AI 需要做什么...

例：读取今日 AI、科技、加密货币新闻，整理成简报，并推送通知"
                class="w-full resize-y rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 text-sm leading-relaxed text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:bg-white focus:ring-2 focus:ring-[#b0804020]"
              />
              <p class="mt-1.5 text-[11px] text-[#9a8a74]">支持多行，可包含具体的操作指令和输出要求</p>
            </div>
          </div>
        </div>

        <!-- 3a. 执行时间（定时模式） -->
        <div v-if="form.execType === 'once'" class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">执行时间</div>
          <input
            v-model="form.runAt"
            type="datetime-local"
            class="w-full rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 text-sm text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:ring-2 focus:ring-[#b0804020] [color-scheme:light]"
          >
          <p class="mt-1.5 text-[11px] text-[#9a8a74]">选择一个未来的时间点，到时自动触发</p>
        </div>

        <!-- 3b. Cron 规则（循环模式） -->
        <div v-if="form.execType === 'repeat'" class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9a8a74]">执行规则</div>

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

          <label class="mb-1.5 block text-sm font-medium text-[#5a4a38]">自定义 Cron</label>
          <input
            v-model="form.cron"
            type="text"
            placeholder="0 8 * * *"
            class="w-full rounded-xl border border-[#ddd0bc] bg-[#faf8f4] px-4 py-2.5 font-mono text-sm text-[#3a2e20] outline-none transition focus:border-[#b08040] focus:ring-2 focus:ring-[#b0804020]"
          >
          <div class="mt-2 flex items-center gap-3 text-[11px] text-[#9a8a74]">
            <span>格式：分 时 日 月 周</span>
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
            取消
          </button>
          <button
            type="button"
            class="rounded-xl bg-[#4a3520] px-6 py-2.5 text-sm font-semibold text-[#f0e4cc] shadow-sm hover:bg-[#5a4530] transition disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting"
            @click="submit"
          >
            {{ submitting ? '提交中...' : submitLabel }}
          </button>
        </div>

        <!-- 结果 -->
        <div v-if="result" class="rounded-2xl border border-[#e4d8c4] bg-white p-5 shadow-sm">
          <div class="mb-2 flex items-center gap-2">
            <span class="text-sm font-bold text-[#4a8a38]">{{ result.scheduled ? '已安排' : '执行完成' }}</span>
            <span class="rounded bg-[#f0e5d5] px-2 py-0.5 text-[10px] text-[#7a6a58]">#{{ result.id }}</span>
          </div>
          <div v-if="result.response" class="whitespace-pre-wrap rounded-lg bg-[#eef7ea] px-3 py-2 text-[13px] leading-relaxed text-[#2d4a30]">{{ result.response }}</div>
          <div v-if="result.scheduled" class="text-[13px] text-[#4a8a38]">已加入调度队列</div>
          <button
            v-if="result.taskId"
            type="button"
            class="mt-3 text-xs text-[#7a6a58] underline underline-offset-2 hover:text-[#4a3a28] transition"
            @click="$router.push(`/task/${result.taskId}`)"
          >查看任务详情</button>
          <button
            v-if="result.scheduled"
            type="button"
            class="mt-3 text-xs text-[#7a6a58] underline underline-offset-2 hover:text-[#4a3a28] transition"
            @click="goSchedule"
          >查看调度列表</button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const execTypes = computed(() => [
  { value: 'once', icon: '📅', label: '定时执行', desc: '在指定的某个时间点执行一次' },
  { value: 'repeat', icon: '🔄', label: '循环执行', desc: '按照 Cron 规则周期性重复执行' }
]);

const cronPresets = computed(() => [
  { label: '每天', cron: '0 8 * * *' },
  { label: '每周一', cron: '0 9 * * 1' },
  { label: '每月1号', cron: '0 8 1 * *' },
  { label: '每小时', cron: '0 * * * *' },
  { label: '每 5 分钟', cron: '*/5 * * * *' },
  { label: '工作日', cron: '0 9 * * 1-5' }
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
  if (form.execType === 'once') return '安排任务';
  return '创建循环';
});

const cronDescription = computed(() => {
  const map = {
    '0 8 * * *': '每天8点',
    '0 9 * * 1': '每周一',
    '0 8 1 * *': '每月1号',
    '0 * * * *': '每小时',
    '*/5 * * * *': '每 5 分钟',
    '0 9 * * 1-5': '工作日'
  };
  return map[form.cron.trim()] || '';
});

const submit = async () => {
  error.value = '';
  result.value = null;

  if (!form.prompt.trim()) { error.value = '请填写提示词'; return; }
  if (!form.name.trim()) { error.value = '请填写任务名称'; return; }
  if (form.execType === 'once' && !form.runAt) { error.value = '请选择执行时间'; return; }
  if (form.execType === 'repeat' && !form.cron.trim()) { error.value = '请填写 cron 表达式'; return; }
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
    error.value = e.message || '提交失败';
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
    error.value = e.message || '提交失败';
  }
};

watch(() => route.params.id, () => {
  initFromRoute();
}, { immediate: true });
</script>
