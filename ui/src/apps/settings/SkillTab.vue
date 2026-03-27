<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <div class="text-sm font-semibold text-[#5a3e28] dark:text-[#e8dcc8]">{{ t('settings_skills_title') }}</div>
        <div class="mt-1 text-xs text-[#8e7c62] dark:text-[#7a6752]">{{ t('settings_skills_hint') }}</div>
      </div>
      <button
        @click="$emit('refresh')"
        class="rounded-lg border border-[#d6c7ae] px-3 py-1.5 text-[12px] font-medium text-[#6a4f32] transition-colors hover:border-[#b08a40] hover:text-[#4a321c] dark:border-[#3a2a18] dark:text-[#c8a060] dark:hover:border-[#c8a060]"
      >
        {{ t('settings_skills_refresh') }}
      </button>
    </div>

    <div v-if="loading" class="rounded-xl border border-[#e3d8c4] bg-[#fffdf8] px-4 py-3 text-[13px] text-[#8e7c62] dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.8)] dark:text-[#7a6752]">
      {{ t('settings_skills_loading') }}
    </div>

    <div v-else-if="error" class="rounded-xl border border-[#c78686] bg-[#fff4f4] px-4 py-3 text-[13px] text-[#8a3838] dark:border-[#6a2a2a] dark:bg-[rgba(80,24,24,0.45)] dark:text-[#d7aaaa]">
      {{ error }}
    </div>

    <div v-else class="space-y-5">
      <div v-for="group in groups" :key="group.key" class="space-y-2">
        <div class="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9b896e] dark:text-[#7e6a54]">
          {{ group.label }}
          <span class="ml-1 normal-case tracking-normal">({{ group.items.length }})</span>
        </div>

        <div v-if="group.items.length === 0" class="rounded-xl border border-dashed border-[#ddd1bc] px-4 py-3 text-[13px] text-[#9d8a6f] dark:border-[#3a2a18] dark:text-[#7e6a54]">
          {{ t('settings_skills_empty_group') }}
        </div>

        <div v-else class="space-y-2">
          <article
            v-for="item in group.items"
            :key="item.id"
            class="rounded-xl border border-[#e3d8c4] bg-[#fffdf8] px-4 py-3 dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.8)]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="text-[14px] font-semibold text-[#4a3622] dark:text-[#ead8bc]">{{ item.name }}</div>
                <div v-if="item.description" class="mt-1 text-[13px] leading-5 text-[#7f6b52] dark:text-[#9e8a72]">{{ item.description }}</div>
              </div>
              <span class="shrink-0 rounded-full bg-[#f0e4d0] px-2 py-1 text-[11px] font-medium text-[#7a5e3d] dark:bg-[rgba(200,160,96,0.12)] dark:text-[#c8a060]">
                {{ item.source === 'project' ? t('settings_skills_source_project') : t('settings_skills_source_system') }}
              </span>
            </div>
            <div class="mt-2 text-[12px] text-[#9b896e] dark:text-[#7e6a54]">{{ item.path }}</div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '../../i18n/index.ts';

const { t } = useI18n();

const props = defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' }
});

defineEmits(['refresh']);

const groups = computed(() => [
  {
    key: 'project',
    label: t('settings_skills_group_project'),
    items: props.items.filter((item) => item.source === 'project')
  },
  {
    key: 'system',
    label: t('settings_skills_group_system'),
    items: props.items.filter((item) => item.source === 'system')
  }
]);
</script>
