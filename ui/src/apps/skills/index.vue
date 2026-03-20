<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4">
        <h1 class="m-0 text-xl font-bold text-[#4a3a28]">{{ t('app_sidebar_skills') }}</h1>
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="loading" class="py-8 text-center text-xs text-[#a0907a]">...</div>
        <div v-else-if="skills.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">
          暂无技能，在 skills/ 下新建子目录，目录内放 SKILL.md 即可
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="s in skills"
            :key="s.id"
            class="rounded-lg border border-[#efe4d4] bg-[#fcfaf6] px-4 py-3 transition hover:bg-[#f8f1e7]"
          >
            <div class="text-[13px] font-semibold text-[#4a3a28]">{{ s.name || s.id }}</div>
            <div v-if="s.description" class="mt-1 text-[11px] leading-relaxed text-[#7a6a58]">{{ s.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '../../i18n/index.js';
import { chatPanel } from '../../stores/chatPanel.js';

const { t } = useI18n();
const skills = ref([]);
const loading = ref(true);

onMounted(async () => {
  chatPanel.setContext({ scene: 'skills', label: t('app_sidebar_skills') });
  chatPanel.setQuickMessages([t('skills_chat_quick_1'), t('skills_chat_quick_2'), t('skills_chat_quick_3')]);
  try {
    const res = await fetch('/aios/api/skills/list');
    const data = await res.json();
    skills.value = data.success ? data.data : [];
  } catch { /* ignore */ }
  loading.value = false;
});
onUnmounted(() => { chatPanel.clearContext(); chatPanel.setQuickMessages([]); });
</script>
