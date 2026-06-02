<script setup>
function parsePayload(payload) {
  if (!payload) return {};
  if (typeof payload === 'object') return payload;
  try { return JSON.parse(payload); } catch { return {}; }
}
function payloadText(payload) {
  const p = parsePayload(payload);
  const first = Array.isArray(p.messages) ? p.messages.find((m) => m?.role === 'user') : null;
  const content = first?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map((part) => part?.text || '').filter(Boolean).join(' ');
  return '';
}
const props = defineProps({
  task: { type: Object, required: true },
  status: { type: Object, required: true },        // { label, icon, cls }
  showStatus: { type: Boolean, default: true },    // 已完成 list 简化展示, 可隐藏 badge
  preview: { type: Function, required: true },
  relTime: { type: Function, required: true }
});
defineEmits(['open', 'stop', 'rerun']);

const BADGE_CLS = {
  pending: 'bg-warn/10 text-warn border border-warn/20',
  running: 'bg-blue-bg text-blue-fg',
  done:    'bg-good/10 text-good border border-good/20',
  error:   'bg-bad/10 text-bad border border-bad/20',
  aborted: 'bg-bg-elev text-muted border border-line'
};
</script>

<template>
  <div
    class="group relative flex cursor-pointer items-start gap-3 border-b border-line-soft px-3 py-3 transition-colors hover:bg-bg-hi"
    @click="$emit('open', task)">

    <div class="flex-1 min-w-0">
      <div class="break-words font-mono text-[13px] leading-[1.55]"
        :class="(status.cls === 'done' || status.cls === 'error' || status.cls === 'aborted') ? 'text-faint' : 'text-ink'">
        {{ task.title || payloadText(task.payload).slice(0, 80) || '(空)' }}
      </div>
      <div v-if="payloadText(task.payload) && payloadText(task.payload) !== task.title"
        class="mt-1 truncate text-[12px] text-muted">
        {{ preview(payloadText(task.payload)) }}
      </div>
      <div class="mt-2 flex items-center gap-2 font-mono text-[10.5px] text-faint">
        <span v-if="showStatus"
          class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold"
          :class="BADGE_CLS[status.cls] || BADGE_CLS.pending">
          <span v-if="task.status === 'pending'" class="msi xxs animate-spin">autorenew</span>
          <span v-else class="msi xxs">{{ status.icon }}</span>
          {{ status.label }}
        </span>
        <span class="rounded bg-bg-elev px-1.5 py-px font-mono text-[10.5px] text-muted">
          {{ task.app }}
        </span>
        <span>{{ relTime(task.created_at) }}</span>
      </div>
    </div>

    <div
      class="flex flex-none gap-0.5 -mt-0.5 -mr-1.5 transition-opacity"
      :class="task.status === 'pending' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
      @click.stop>
      <button v-if="task.status === 'pending'"
        class="grid h-8 w-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-faint transition-colors hover:!bg-bad/10 hover:!text-bad"
        title="停止"
        @click="$emit('stop', task)">
        <span class="msi sm">stop</span>
      </button>
      <button
        class="grid h-8 w-8 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:text-ink"
        title="重跑"
        @click="$emit('rerun', task)">
        <span class="msi sm">replay</span>
      </button>
    </div>
  </div>
</template>
