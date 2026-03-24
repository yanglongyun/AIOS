<template>
  <div class="paper-roll-container -mt-4 w-full max-w-[600px] flex-1 overflow-x-hidden overflow-y-auto pb-12">
    <div class="tractor-paper dot-matrix relative w-full px-[42px] pb-5 pt-7">
      <div class="mb-5 border-b-2 border-dashed border-[#1a1040] pb-3 text-center text-base font-black tracking-[4px] text-[#1a1040]">
        {{ t('cryptobot_decision_log') }}<br>
        <span class="text-[10px] font-normal tracking-normal text-[#5a4e7a]">
          {{ t('cryptobot_ticks', { n: status.state.tick_count }) }}
        </span>
      </div>

      <div v-if="!decisions.length" class="py-6 text-center text-[11px] font-bold text-[#5a4e7a]">
        {{ t('cryptobot_logs_empty') }}
      </div>

      <div
        v-for="d in decisions"
        :key="d.id"
        class="decision-block border-b-2 border-dashed border-[rgba(26,16,64,0.2)] py-4 pl-2.5 last:border-b-0"
        :class="d.ok ? 'ok' : 'fail'"
      >
        <div class="mb-1.5 flex items-start justify-between">
          <div>
            <span class="action-badge mr-1.5 inline-block rounded-sm px-2 py-0.5 text-[10px] font-black tracking-[2px]" :class="d.ok ? 'badge-ok' : 'badge-fail'">
              {{ d.ok ? t('cryptobot_task_ok') : t('cryptobot_task_fail') }}
            </span>
            <span class="text-sm font-black text-[#0d0820]">#{{ d.id }}</span>
          </div>
          <div class="text-right text-[10px] text-[#5a4e7a]">{{ fmtTime(d.created_at) }}</div>
        </div>
        <div class="mb-1 text-[10px] text-[#7060a0]">
          task_id: {{ d.task_id || '-' }}
        </div>
        <div class="mt-1.5 border-l-2 border-[rgba(26,16,64,0.15)] pl-2 text-[11px] leading-relaxed text-[#3a2e60]">
          <span class="mb-0.5 block text-[8px] font-black tracking-[1px] text-[#7060a0]">{{ t('cryptobot_task_summary') }}</span>
          {{ d.summary || '-' }}
          <div v-if="d.error" class="mt-1 text-[10px] text-[#c92a2a]">{{ d.error }}</div>
        </div>
      </div>

      <button
        v-if="hasMore"
        type="button"
        class="mt-4 w-full cursor-pointer text-center text-[10px] font-bold text-[#5a4e7a] transition hover:text-[#1aab40]"
        @click="$emit('loadMore')"
      >
        <span class="bg-[#1a1040] px-2.5 py-[3px] text-[10px] text-[#f5f0e0]">--- {{ t('cryptobot_load_more') }} ---</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../../i18n/index.ts';

defineProps({
  status: { type: Object, required: true },
  decisions: { type: Array, required: true },
  hasMore: { type: Boolean, required: true },
  fmtTime: { type: Function, required: true }
});

defineEmits(['loadMore']);

const { t } = useI18n();
</script>

<style scoped>
.paper-roll-container {
  scrollbar-width: none;
  mask-image: linear-gradient(to bottom, black 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 88%, transparent 100%);
}
.paper-roll-container::-webkit-scrollbar { display: none; }

.tractor-paper {
  background-color: #f5f0e0;
  min-height: 150%;
  box-shadow: 0 8px 30px rgba(0,0,0,0.6);
  background-image:
    radial-gradient(circle at 15px 15px, transparent 5px, rgba(0,0,0,0.07) 6px, transparent 6px),
    radial-gradient(circle at calc(100% - 15px) 15px, transparent 5px, rgba(0,0,0,0.07) 6px, transparent 6px);
  background-size: 100% 30px;
}
.tractor-paper::before,
.tractor-paper::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30px;
  background-image: radial-gradient(circle at 15px 15px, #0d1117 5px, transparent 6px);
  background-size: 100% 30px;
  z-index: 10;
}
.tractor-paper::before { left: 0; }
.tractor-paper::after { right: 0; }

.dot-matrix {
  color: #1a1040;
  font-size: 13px;
  line-height: 1.65;
  letter-spacing: -0.3px;
  text-shadow: 0.5px 0 0.5px rgba(0,0,0,0.12);
}

.decision-block.ok { box-shadow: -4px 0 0 #1aab40; }
.decision-block.fail { box-shadow: -4px 0 0 #c92a2a; }

.badge-ok { background: #1aab40; color: #fff; }
.badge-fail { background: #c92a2a; color: #fff; }
</style>
