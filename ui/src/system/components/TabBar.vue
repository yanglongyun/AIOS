<template>
  <nav class="relative flex h-[62px] flex-none items-stretch" :style="navStyle">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-0 bg-transparent transition-colors active:bg-[rgba(255,255,255,0.04)]"
      @click="$emit('update:modelValue', tab.id)"
    >
      <!-- Brass underline for active tab -->
      <span
        v-if="modelValue === tab.id"
        class="absolute bottom-0 left-[20%] right-[20%] h-[2px] rounded-[1px]"
        :style="underlineStyle"
      />
      <span
        class="leading-none"
        :style="modelValue === tab.id ? activeIconStyle : inactiveIconStyle"
      >{{ tab.icon }}</span>
      <span
        class="text-[10.5px] leading-none"
        :style="modelValue === tab.id ? activeLabelStyle : inactiveLabelStyle"
      >{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
defineProps({ modelValue: { type: String, required: true } });
defineEmits(['update:modelValue']);

const tabs = [
  { id: 'chat',  icon: '💬', label: '对话' },
  { id: 'apps',  icon: '🧩', label: '应用' },
  { id: 'tasks', icon: '⏱️', label: '任务' },
];

// Direct gradient values (not via tokens) — bottom bar is dark wood,
// the rest of the app is parchment via tokens.
const navStyle = {
  background:
    'repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,0.008) 40px,rgba(255,255,255,0.008) 80px),' +
    'var(--bar-bg-bottom)',
  borderTop: '1px solid var(--bar-divider)',
  boxShadow: 'var(--bar-shadow-bottom)',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
};

const underlineStyle = {
  background: 'linear-gradient(90deg, transparent, var(--brass), transparent)',
};

const activeIconStyle = {
  fontSize: '21px',
  color: 'var(--brass-glow)',
  filter:
    'drop-shadow(0 0 6px rgba(200,160,30,0.6)) drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
};
const inactiveIconStyle = {
  fontSize: '21px',
  color: 'rgba(200,180,140,0.55)',
  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
};

const activeLabelStyle = {
  color: 'var(--brass-glow)',
  fontWeight: 600,
  textShadow: '0 0 8px rgba(200,160,30,0.5)',
  letterSpacing: '0.3px',
};
const inactiveLabelStyle = {
  color: 'var(--bar-text-faint)',
  letterSpacing: '0.3px',
};
</script>
