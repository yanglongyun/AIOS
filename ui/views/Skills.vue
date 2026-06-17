<script setup>
import { inject, onMounted, ref } from 'vue';
import { getSkill, listSkills } from '../lib/api.js';
import { t } from '../lib/locale.js';

const setPageNav = inject('pageNav');
const skills = ref([]);
const current = ref(null);
const loading = ref(false);
const error = ref('');

function setListNav() {
  setPageNav(t('nav_skills', 'Skills'), null, null, null);
}

function closeSkill() {
  current.value = null;
  setListNav();
}

function setDetailNav(skill) {
  setPageNav(skill?.name || t('nav_skill', 'Skill'), null, null, null);
}

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await listSkills();
    skills.value = data.skills || [];
  } catch (err) {
    error.value = err.message || t('common_load_failed', 'Load failed');
  } finally {
    loading.value = false;
  }
}

async function openSkill(skill) {
  error.value = '';
  try {
    const data = await getSkill(skill.id);
    current.value = data.skill || null;
    setDetailNav(current.value || skill);
  } catch (err) {
    error.value = err.message || t('common_load_failed', 'Load failed');
  }
}

onMounted(async () => {
  setListNav();
  await refresh();
});
</script>

<template>
  <section class="h-full overflow-y-auto px-6 pb-7 pt-[18px]">
    <div class="mx-auto max-w-[780px]">
      <template v-if="!current">
        <p class="mb-3 max-w-[640px] text-[12px] leading-[1.5] text-[var(--muted)]">{{ t('page_desc_skills', 'Skills are local instruction packs that teach the agent how to handle specific workflows.') }}</p>
        <div v-if="error" class="mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-left text-[13px] text-[#b91c1c]">{{ error }}</div>
        <div v-if="loading && !skills.length" class="rounded-xl p-4 text-center text-[13px] text-[var(--muted)]">Loading skills...</div>
        <div v-else-if="!skills.length" class="rounded-xl p-4 text-center text-[13px] text-[var(--muted)]">No local skills found</div>
        <div v-else class="grid gap-2">
          <button
            v-for="skill in skills"
            :key="skill.id"
            class="flex w-full items-center gap-[11px] rounded-xl border border-[var(--line2)] bg-white p-[11px_12px] text-left shadow-card transition-colors hover:border-[var(--accent)]"
            :class="{ active: current?.id === skill.id }"
            type="button"
            @click="openSkill(skill)"
          >
            <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#eef4fe] text-xs font-bold text-[var(--accent-d)]">S</span>
            <span class="min-w-0 flex-1 [&>b]:block [&>b]:overflow-hidden [&>b]:text-ellipsis [&>b]:whitespace-nowrap [&>b]:text-[13.5px] [&>b]:font-semibold [&>b]:text-[var(--ink)] [&>small]:mt-1 [&>small]:block [&>small]:overflow-hidden [&>small]:text-ellipsis [&>small]:whitespace-nowrap [&>small]:text-xs [&>small]:leading-[1.45] [&>small]:text-[var(--muted)]">
              <b>{{ skill.name }}</b>
              <small>{{ skill.description || skill.path }}</small>
            </span>
          </button>
        </div>
      </template>

      <article v-else class="rounded-xl border border-[var(--line2)] bg-white p-[18px] shadow-card skill-reader">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <button type="button" @click="closeSkill">Back</button>
        </div>
        <p v-if="current.path" class="-mt-1 mb-3 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] text-[var(--muted)]">{{ current.path }}</p>
        <pre>{{ current.content }}</pre>
      </article>
    </div>
  </section>
</template>
