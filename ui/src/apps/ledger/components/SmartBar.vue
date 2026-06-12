<template>
  <div class="smart card">
      <input
        v-model="text"
        :disabled="busy"
        placeholder="__T_LEDGER_SMART_PLACEHOLDER__"
        @keyup.enter="$emit('send')"
      />
      <button class="send" :disabled="busy" :class="{ busy }" @click="$emit('send')" aria-label="__T_COMMON_SEND__">
        <span v-if="busy" class="spin"></span>
        <ArrowUp v-else :size="14" :stroke-width="2" />
      </button>
  </div>
  <div class="smart-err" :class="{ show: error }">{{ error }}</div>
</template>

<script setup>
import { ArrowUp } from 'lucide-vue-next';

defineProps({
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
});
defineEmits(['send']);
const text = defineModel('text', { type: String, default: '' });
</script>

<style scoped>
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px 20px}
.smart{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:999px;margin-bottom:6px}
.smart input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:var(--ink);font-size:13.5px}
.smart input::placeholder{color:var(--muted)}
.smart .send{display:grid;place-items:center;width:34px;height:34px;border-radius:999px;border:0;background:var(--accent);color:#fff;cursor:pointer;flex-shrink:0;transition:background .12s}
.smart .send:hover{background:var(--color-accent-hi)}
.smart .send:disabled{cursor:default;opacity:.85}
.smart .spin{width:14px;height:14px;border-radius:999px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:lg-spin .7s linear infinite}
@keyframes lg-spin{to{transform:rotate(360deg)}}
.smart-err{min-height:18px;padding:2px 16px 0;font-size:12px;color:var(--red);opacity:0;transition:opacity .2s;margin-bottom:10px}
.smart-err.show{opacity:1}
</style>
