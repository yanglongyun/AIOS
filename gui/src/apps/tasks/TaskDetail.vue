<script setup>
const props = defineProps({
  task: { type: Object, required: true },
  status: { type: Object, required: true },       // { label, icon, cls }
  relTime: { type: Function, required: true }
});
defineEmits(['back', 'stop', 'rerun']);

const BADGE_CLS = {
  pending: 'bg-[#fef7e0] text-[#b06000]',
  running: 'bg-blue-bg text-blue-fg',
  success: 'bg-[#e6f4ea] text-good',
  failed:  'bg-[#fce8e6] text-bad'
};
</script>

<template>
  <div class="flex h-full max-w-[960px] mx-auto flex-col py-4">

    <header class="flex flex-none items-start gap-3 px-0 pt-2 pb-4 border-b border-line-soft">
      <button class="icon-btn" title="返回列表" @click="$emit('back')">
        <span class="msi">arrow_back</span>
      </button>
      <div class="flex-1 min-w-0 pt-1.5">
        <div class="text-[20px] font-medium tracking-[-0.01em] text-ink leading-[1.35] break-words">
          {{ task.title || (task.prompt || '').slice(0, 80) || '(空)' }}
        </div>
        <div class="mt-2 flex flex-wrap items-center gap-2 text-[11.5px] text-faint">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[11px] font-medium"
            :class="BADGE_CLS[status.cls] || BADGE_CLS.pending">
            <span v-if="task.status === 'running'" class="msi xxs animate-spin">autorenew</span>
            <span v-else class="msi xxs">{{ status.icon }}</span>
            {{ status.label }}
          </span>
          <span class="px-1.5 py-px rounded font-mono text-[10.5px] text-muted bg-bg-elev">{{ task.app }}</span>
          <span>{{ relTime(task.created_at) }}</span>
        </div>
      </div>
      <div class="flex flex-none gap-1">
        <button v-if="task.status === 'running'"
          class="icon-btn"
          title="停止"
          @click="$emit('stop', task)">
          <span class="msi">stop</span>
        </button>
        <button class="icon-btn" title="重跑" @click="$emit('rerun', task)">
          <span class="msi">replay</span>
        </button>
      </div>
    </header>

    <div class="flex-1 min-h-0 overflow-y-auto pt-5 pb-10 flex flex-col gap-3.5">
      <section v-if="task.prompt" class="rounded-xl px-4.5 py-3.5 bg-[#fafbfc]">
        <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Prompt</div>
        <pre class="m-0 font-mono text-[12.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">{{ task.prompt }}</pre>
      </section>
      <section v-if="task.response" class="rounded-xl px-4.5 py-3.5 bg-[#fafbfc]">
        <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">Response</div>
        <pre class="m-0 font-mono text-[12.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">{{ typeof task.response === 'string' ? task.response : JSON.stringify(task.response, null, 2) }}</pre>
      </section>
      <section v-if="task.error" class="rounded-xl px-4.5 py-3.5 bg-[#fff3f2]">
        <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-bad">Error</div>
        <pre class="m-0 font-mono text-[12.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">{{ task.error }}</pre>
      </section>
      <section v-if="!task.response && !task.error" class="rounded-xl px-4.5 py-3.5 bg-bg-elev">
        <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">状态</div>
        <pre class="m-0 font-mono text-[12.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">{{
          task.status === 'running' ? '执行中…'
          : task.status === 'pending' ? '排队中…'
          : '(无输出)'
        }}</pre>
      </section>
    </div>
  </div>
</template>
