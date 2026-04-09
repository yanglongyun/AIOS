<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-sm font-semibold text-[#222]">__T_SETTINGS_SKILLS_TITLE__</div>
        <div class="mt-1 text-xs text-black/40">__T_SETTINGS_SKILLS_HINT__</div>
      </div>
      <button
        @click="$emit('refresh')"
        class="rounded-lg border border-black/10 px-3 py-1.5 text-[12px] font-medium text-black/50 transition-colors hover:border-[#222] hover:text-[#222]"
      >
        __T_SETTINGS_SKILLS_REFRESH__
      </button>
    </div>

    <div v-if="loading" class="rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[13px] text-black/40">
      __T_SETTINGS_SKILLS_LOADING__
    </div>

    <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
      {{ error }}
    </div>

    <div v-else-if="items.length === 0" class="rounded-xl border border-dashed border-black/10 px-4 py-3 text-[13px] text-black/35">
      __T_SETTINGS_SKILLS_EMPTY_GROUP__
    </div>

    <div v-else class="space-y-2">
      <article
        v-for="item in items"
        :key="item.id"
        class="rounded-xl border border-black/[0.08] bg-white px-4 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-[14px] font-semibold text-[#222]">{{ item.name }}</div>
            <div v-if="item.description" class="mt-1 text-[13px] leading-5 text-black/50">{{ item.description }}</div>
          </div>
        </div>
        <div class="mt-2 text-[12px] text-black/30">{{ item.path }}</div>
      </article>
    </div>
  </section>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
});

defineEmits(['refresh']);
</script>
