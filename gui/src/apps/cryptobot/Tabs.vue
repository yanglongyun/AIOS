<script setup>
const props = defineProps({
    tabs: { type: Array, required: true },
    active: { type: String, required: true }
});

defineEmits(['update:active']);
</script>

<template>
    <nav class="mx-auto mb-3 flex max-w-[1180px] gap-0 overflow-x-auto rounded-lg border border-[var(--c-line)] bg-[var(--c-card)] px-1">
        <button v-for="t in tabs" :key="t.key"
                class="cb-tab"
                :class="{ 'cb-tab-active': active === t.key }"
                @click="$emit('update:active', t.key)">
            <span class="msi xs">{{ t.icon }}</span>
            <span>{{ t.label }}</span>
        </button>
    </nav>
</template>

<style scoped>
.cb-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 11px 18px;
    border: 0;
    background: transparent;
    color: var(--c-text-3);
    font-size: 12.5px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.15s;
}
.cb-tab:hover { color: var(--c-text-2); }
.cb-tab-active { color: var(--c-gold); }
.cb-tab-active::after {
    content: '';
    position: absolute;
    left: 18px; right: 18px; bottom: -1px;
    height: 2px;
    background: var(--c-gold);
    box-shadow: 0 0 8px var(--c-gold);
    border-radius: 2px 2px 0 0;
}
</style>
