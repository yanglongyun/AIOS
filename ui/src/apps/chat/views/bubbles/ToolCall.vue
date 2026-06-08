<script setup>
defineProps({
  msg: { type: Object, required: true }
});
</script>

<template>
  <div class="mb-3 flex items-start">
    <div class="min-w-0 max-w-[min(78vw,720px)] flex-1 overflow-hidden rounded-xl border border-[rgba(180,150,80,0.22)] bg-[linear-gradient(160deg,#faf5e8_0%,#f2ebd8_100%)] shadow-[0_2px_8px_rgba(90,60,20,0.1),inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div class="flex cursor-pointer select-none items-center gap-2 bg-[linear-gradient(180deg,#f5ead8_0%,#ede0c8_100%)] px-3 py-2" @click="msg.expanded = !msg.expanded">
        <span class="shrink-0 text-[10px] text-[#a0907a]">{{ msg.expanded ? '▼' : '▶' }}</span>
        <span class="min-w-0 flex-1 truncate font-sans text-[12px] font-semibold text-[#5a4a38]">{{ msg.title }}</span>
        <span v-if="msg.result" class="font-sans text-[11px] text-[#6a8a50]">完成</span>
      </div>
      <div v-if="msg.expanded" class="overflow-hidden">
        <div v-if="msg.shell && msg.command" class="tool-scroll overflow-x-auto whitespace-pre bg-[#fffdf8] px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[#2d6a30] [scrollbar-width:none] [word-break:normal]"><span class="select-none text-[#a0907a]">$ </span>{{ msg.command }}</div>
        <div v-else-if="msg.detail" class="tool-scroll overflow-x-auto whitespace-pre bg-[#fffdf8] px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[#2d6a30] [scrollbar-width:none] [word-break:normal]">{{ msg.detail }}</div>
        <template v-if="msg.result">
          <div class="h-px bg-[#dcd0b8]"></div>
          <div class="tool-scroll overflow-x-auto whitespace-pre bg-[#fffdf8] px-3 py-2.5 font-mono text-[11px] leading-[1.6] text-[#7a6a50] [scrollbar-width:none] [word-break:normal]">{{ msg.result }}</div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-scroll::-webkit-scrollbar { display: none; }
</style>
