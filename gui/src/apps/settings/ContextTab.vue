<template>
  <section class="space-y-5">
    <div>
      <div class="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_CONTEXT_ROUNDS__</div>
      <div class="flex gap-2">
        <button
          v-for="n in [30, 100, 500]"
          :key="n"
          class="flex-1 rounded-[10px] border py-2.5 text-[14px] font-semibold transition-colors"
          :class="contextRounds === n
            ? 'border-transparent bg-blue-bg text-blue-fg'
            : 'border-line-hi bg-transparent text-muted hover:bg-bg-hi hover:text-ink'"
          @click="$emit('update:context-rounds', n)"
        >{{ n }}</button>
      </div>
    </div>

    <div class="flex justify-end">
      <button class="save-btn" @click="$emit('save')">__T_COMMON_SAVE__</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  contextRounds: { type: Number, default: 100 }
});
defineEmits(['update:context-rounds', 'save']);
</script>
