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
  pending: 'bg-warn/10 text-warn',
  running: 'bg-blue-bg text-blue-fg',
  done:    'bg-good/10 text-good',
  error:   'bg-bad/10 text-bad',
  aborted: 'bg-bg-elev text-muted'
};
</script>

<template>
  <div
    class="group relative flex items-start gap-3 px-3 py-3 border-b border-line-soft cursor-pointer transition-colors hover:bg-bg-hi"
    @click="$emit('open', task)">

    <div class="flex-1 min-w-0">
      <div class="text-[14px] leading-[1.5] break-words"
        :class="(status.cls === 'done' || status.cls === 'error' || status.cls === 'aborted') ? 'text-faint' : 'text-ink'">
        {{ task.title || payloadText(task.payload).slice(0, 80) || '(空)' }}
      </div>
      <div v-if="payloadText(task.payload) && payloadText(task.payload) !== task.title"
        class="mt-0.5 truncate text-[12.5px] text-muted">
        {{ preview(payloadText(task.payload)) }}
      </div>
      <div class="mt-1.5 flex items-center gap-2 text-[11.5px] text-faint">
        <span v-if="showStatus"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[11px] font-medium"
          :class="BADGE_CLS[status.cls] || BADGE_CLS.pending">
          <span v-if="task.status === 'pending'" class="msi xxs animate-spin">autorenew</span>
          <span v-else class="msi xxs">{{ status.icon }}</span>
          {{ status.label }}
        </span>
        <span class="px-1.5 py-px rounded font-mono text-[10.5px] text-muted bg-bg-elev">
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
        class="grid h-8 w-8 place-items-center rounded-full border-0 bg-transparent text-faint cursor-pointer transition-colors hover:!bg-bad/10 hover:!text-bad"
        title="停止"
        @click="$emit('stop', task)">
        <span class="msi sm">stop</span>
      </button>
      <button
        class="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-faint cursor-pointer transition-colors hover:bg-bg-hi hover:text-ink"
        title="重跑"
        @click="$emit('rerun', task)">
        <span class="msi sm">replay</span>
      </button>
    </div>
  </div>
</template>
