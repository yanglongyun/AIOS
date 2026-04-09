<template>
  <section class="space-y-4">
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <div class="mb-3 text-[12px] font-semibold uppercase tracking-wide" style="color:rgba(0,0,0,0.35)">__T_SETTINGS_CONTEXT_ROUNDS__</div>
      <div class="flex gap-2">
        <button
          v-for="n in [30, 100, 500]"
          :key="n"
          @click="$emit('update:context-rounds', n)"
          class="flex-1 rounded-[9px] border py-2.5 text-[14px] font-semibold transition-all"
          :style="contextRounds === n
            ? 'background:#5c4332;border-color:#5c4332;color:#fff'
            : 'background:#faf8f5;border-color:rgba(0,0,0,0.1);color:rgba(0,0,0,0.4)'"
        >{{ n }}</button>
      </div>
    </div>
    <div class="flex justify-end">
      <button @click="$emit('save')" class="s-btn-primary">__T_COMMON_SAVE__</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  contextRounds: { type: Number, default: 100 }
});
defineEmits(['update:context-rounds', 'save']);
</script>

<style scoped>
.s-btn-primary {
  padding: 8px 20px;
  border-radius: 9px;
  background: #5c4332;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}
.s-btn-primary:hover { background: #3d2a1e; }
</style>
