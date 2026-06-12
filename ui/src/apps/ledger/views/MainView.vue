<template>
  <div class="page">
    <div class="h-row">
      <h2>记账本</h2>
      <div class="pill-btn month">
        <button class="nav" @click="$emit('shift-month', -1)">‹</button>
        <b>{{ monthLabel }}</b>
        <button class="nav" @click="$emit('shift-month', 1)">›</button>
      </div>
    </div>

    <div class="card bal" style="margin-bottom:16px">
      <small>月结余 · BALANCE</small>
      <div class="num" :class="{ neg: summary.balance < 0 }">¥ {{ money(summary.balance) }}</div>
      <div class="io"><span class="in">↘ 收入 ¥{{ money(summary.income) }}</span><span class="out">↗ 支出 ¥{{ money(summary.expense) }}</span></div>
    </div>

    <SmartBar v-model:text="smartText" :busy="smartBusy" :error="smartError" @send="$emit('smart-send')" />

    <template v-if="entries.length">
      <EntryRow v-for="entry in entries" :key="entry.id" :entry="entry" :category="cat(entry.category)" @open="$emit('open', $event)" />
    </template>
    <div v-else class="empty"><b>这个月还没有账目</b><p>在上方输入框随手记一笔</p></div>
  </div>
</template>

<script setup>
import SmartBar from '../components/SmartBar.vue';
import EntryRow from '../components/EntryRow.vue';
import { money } from '../lib/format.js';

defineProps({
  monthLabel: { type: String, default: '' },
  summary: { type: Object, required: true },
  entries: { type: Array, default: () => [] },
  cat: { type: Function, required: true },
  smartBusy: { type: Boolean, default: false },
  smartError: { type: String, default: '' },
});
defineEmits(['shift-month', 'smart-send', 'open']);
const smartText = defineModel('smartText', { type: String, default: '' });
</script>

<style scoped>
.page{width:min(860px,100%);margin:0 auto;padding:26px 24px 50px}
.h-row{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.h-row h2{font-size:17px;font-weight:700;flex:1;color:var(--ink)}
.pill-btn{display:flex;align-items:center;gap:7px;padding:7px 14px;border-radius:999px;border:1px solid var(--line2);font-size:13px;color:var(--ink2);background:var(--panel)}
.month{gap:2px;padding:2px 6px}
.month .nav{border:0;background:transparent;border-radius:999px;padding:4px 8px;color:var(--ink2);font-weight:600;cursor:pointer}
.month .nav:hover{background:var(--color-bg-hi)}
.month b{font-size:12.5px;font-weight:600;padding:0 4px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px 20px}
.bal{text-align:center;padding:26px 20px 22px}
.bal small{font-size:11px;letter-spacing:1.5px;color:var(--muted)}
.bal .num{font-size:34px;font-weight:750;margin:6px 0 10px;font-variant-numeric:tabular-nums}
.bal .num.neg{color:var(--red)}
.io{display:flex;justify-content:center;gap:26px;font-size:12.5px}
.io .in{color:var(--green)}.io .out{color:var(--red)}
.empty{text-align:center;color:var(--muted);padding:9vh 20px}.empty b{display:block;color:var(--ink);font-size:16px}
</style>
