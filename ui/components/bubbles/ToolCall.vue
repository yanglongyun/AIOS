<script setup>
defineProps({
  msg: { type: Object, required: true }
});
</script>

<template>
  <div class="my-4 animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.3,1)_both]">
    <div class="mb-1.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">Tool call</div>
    <div class="overflow-hidden rounded-xl border border-[var(--line2)] bg-white shadow-card">
      <div class="flex cursor-pointer select-none items-center gap-2 bg-[#f7f7f8] px-3 py-[9px]" @click="msg.expanded = !msg.expanded">
        <span class="shrink-0 text-[10px] text-[var(--muted)]">{{ msg.expanded ? '▼' : '▶' }}</span>
        <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-[var(--ink2)]">{{ msg.title }}</span>
        <span v-if="msg.result" class="text-[11px] text-[var(--win)]">Done</span>
      </div>
      <div v-if="msg.expanded" class="tool-body">
        <div v-if="msg.shell && msg.command" class="overflow-x-auto whitespace-pre bg-[#1d1d20] px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[#e8e8ea]"><span class="select-none text-[#9ca3af]">$ </span>{{ msg.command }}</div>
        <div v-else-if="msg.detail" class="overflow-x-auto whitespace-pre bg-[#1d1d20] px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[#e8e8ea]">{{ msg.detail }}</div>
        <template v-if="msg.result">
          <div class="h-px bg-[var(--line)]"></div>
          <div class="overflow-x-auto whitespace-pre bg-white px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[var(--ink2)]">{{ msg.result }}</div>
        </template>
      </div>
    </div>
  </div>
</template>
