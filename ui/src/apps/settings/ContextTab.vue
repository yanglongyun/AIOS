<template>
  <section class="space-y-3">
    <div class="text-xs font-medium text-black/40">__T_SETTINGS_CONTEXT_ROUNDS__</div>
    <div class="flex gap-2">
      <button
        v-for="n in [30, 100, 500]"
        :key="n"
        @click="$emit('update:context-rounds', n)"
        class="flex-1 px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-all border"
        :class="contextRounds === n
          ? 'bg-[#222] border-[#222] text-white font-semibold'
          : 'border-black/10 text-black/40 hover:border-black/20 hover:text-black/60'"
      >
        {{ n }}
      </button>
    </div>
    <div class="pt-2 flex justify-start">
      <button @click="$emit('save')" class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-[#222] text-white cursor-pointer hover:bg-black transition-colors">__T_COMMON_SAVE__</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  contextRounds: { type: Number, default: 100 }
});

defineEmits(['update:context-rounds', 'save']);
</script>
