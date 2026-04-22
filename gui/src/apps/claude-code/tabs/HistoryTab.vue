<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <div>
      <div class="text-[17px] font-bold">__T_CLAUDE_HISTORY_TITLE__</div>
      <div class="text-[11.5px]" style="color:#6b5a46">__T_CLAUDE_HISTORY_SOURCE__ <span class="cc-mono">~/.claude/history.jsonl</span> · {{ '__T_CLAUDE_HISTORY_TOTAL__'.replace('{n}', String(data?.total || 0)) }}</div>
    </div>
    <div v-if="!data" class="text-[12px]" style="color:#8a7965">__T_CLAUDE_LOADING__</div>
    <div v-else-if="!data.items?.length" class="text-[12px]" style="color:#8a7965">__T_CLAUDE_HISTORY_EMPTY__</div>
    <div v-else class="rounded-xl bg-white border" style="border-color:rgba(140,100,60,0.12)">
      <div v-for="(h, i) in data.items" :key="i" class="px-3 py-2 flex gap-3"
        :style="i < data.items.length - 1 ? 'border-bottom:1px solid rgba(140,100,60,0.06)' : ''">
        <div class="cc-mono shrink-0" style="font-size:10.5px;color:#8a7965;min-width:110px">{{ formatShortTime(h.timestamp) }}</div>
        <div class="min-w-0">
          <div class="text-[12.5px]" style="color:#2a1f13">{{ h.display || '__T_CLAUDE_HISTORY_BLANK__' }}</div>
          <div class="cc-mono text-[10px] truncate" style="color:#8a7965">{{ h.project }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatShortTime } from '../utils.js';
defineProps({ data: { type: Object, default: null } });
</script>
