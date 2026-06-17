<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue';
import { createMemory, deleteMemory, listMemories, updateMemory } from '../lib/api.js';
import { t } from '../lib/locale.js';

const setPageNav = inject('pageNav');
const memories = ref([]);
const selectedId = ref(null);
const mode = ref('list');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const form = reactive({
  title: '',
  description: '',
  body: '',
  visibility: 'stored',
});

const selected = computed(() => memories.value.find((item) => item.id === selectedId.value) || null);

function setListNav() {
  setPageNav(t('nav_memories', 'Memories'), null, null, null);
}

function setEditorNav(title = t('nav_memory', 'Memory')) {
  setPageNav(title, null, null, null);
}

function resetForm() {
  selectedId.value = null;
  mode.value = 'list';
  Object.assign(form, { title: '', description: '', body: '', visibility: 'stored' });
}

function newMemory() {
  selectedId.value = null;
  mode.value = 'new';
  Object.assign(form, { title: '', description: '', body: '', visibility: 'stored' });
  setEditorNav(t('nav_new_memory', 'New memory'));
}

function editMemory(memory) {
  selectedId.value = memory.id;
  mode.value = 'edit';
  Object.assign(form, {
    title: memory.title || '',
    description: memory.description || '',
    body: memory.body || '',
    visibility: memory.visibility || 'stored',
  });
  setEditorNav(memory.title || t('nav_memory', 'Memory'));
}

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await listMemories();
    memories.value = data.memories || [];
  } catch (err) {
    error.value = err.message || t('common_load_failed', 'Load failed');
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!form.title.trim() || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    const payload = {
      title: form.title,
      description: form.description,
      body: form.body,
      visibility: form.visibility,
    };
    if (selected.value) await updateMemory(selected.value.id, payload);
    else await createMemory(payload);
    await refresh();
    resetForm();
    setListNav();
  } catch (err) {
    error.value = err.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!selected.value) return;
  error.value = '';
  try {
    await deleteMemory(selected.value.id);
    await refresh();
    resetForm();
    setListNav();
  } catch (err) {
    error.value = err.message || 'Delete failed';
  }
}

function visibilityText(value) {
  return {
    must: 'Must',
    star: 'Star',
    stored: 'Stored',
  }[value] || value;
}

onMounted(async () => {
  setListNav();
  await refresh();
});
</script>

<template>
  <section class="h-full overflow-y-auto px-6 pb-7 pt-[18px]">
    <div class="mx-auto max-w-[780px]">
      <template v-if="mode === 'list'">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p class="mb-3 max-w-[640px] text-[12px] leading-[1.5] text-[var(--muted)]">{{ t('page_desc_memories', 'Memories are durable facts and instructions the agent can reuse across conversations.') }}</p>
          <button type="button" @click="newMemory">New</button>
        </div>
        <div v-if="error" class="mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-left text-[13px] text-[#b91c1c]">{{ error }}</div>
        <div v-if="loading && !memories.length" class="rounded-xl p-4 text-center text-[13px] text-[var(--muted)]">Loading memories...</div>
        <div v-else-if="!memories.length" class="rounded-xl p-4 text-center text-[13px] text-[var(--muted)]">No memories yet</div>
        <div v-else class="grid gap-2">
          <button
            v-for="memory in memories"
            :key="memory.id"
            class="flex w-full items-start gap-[11px] rounded-xl border border-[var(--line2)] bg-white p-[11px_12px] text-left shadow-card transition-colors hover:border-[var(--accent)]"
            :class="{ active: selectedId === memory.id }"
            type="button"
            @click="editMemory(memory)"
          >
            <span class="min-w-[52px] rounded-full bg-[#f3f3f4] px-[7px] py-1 text-center text-[10.5px] font-bold text-[var(--muted)] [&.must]:bg-[#eef4fe] [&.must]:text-[var(--accent-d)] [&.star]:bg-[var(--fix-soft)] [&.star]:text-[#9d6a17]" :class="memory.visibility">{{ visibilityText(memory.visibility) }}</span>
            <span class="min-w-0 flex-1 [&>b]:block [&>b]:overflow-hidden [&>b]:text-ellipsis [&>b]:whitespace-nowrap [&>b]:text-[13.5px] [&>b]:font-semibold [&>b]:text-[var(--ink)] [&>small]:mt-1 [&>small]:block [&>small]:overflow-hidden [&>small]:text-ellipsis [&>small]:whitespace-nowrap [&>small]:text-xs [&>small]:leading-[1.45] [&>small]:text-[var(--muted)]">
              <b>{{ memory.title }}</b>
              <small>{{ memory.description || memory.body || 'No description' }}</small>
            </span>
          </button>
        </div>
      </template>

      <form v-else class="rounded-xl border border-[var(--line2)] bg-white p-[18px] shadow-card" @submit.prevent="save">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2>{{ selected ? 'Edit memory' : 'New memory' }}</h2>
          <div class="flex shrink-0 items-center gap-2">
            <button type="button" @click="resetForm(); setListNav()">Back</button>
            <button v-if="selected" class="rounded-lg bg-[#fef2f2] px-3 py-2 text-[12.5px] font-semibold text-[#b91c1c]" type="button" @click="remove">Delete</button>
          </div>
        </div>
        <label>
          Title
          <input v-model="form.title" placeholder="What should AI remember?" />
        </label>
        <label>
          Visibility
          <select v-model="form.visibility">
            <option value="stored">Stored</option>
            <option value="star">Star</option>
            <option value="must">Must</option>
          </select>
        </label>
        <label>
          Description
          <input v-model="form.description" placeholder="Short summary" />
        </label>
        <label>
          Body
          <textarea v-model="form.body" rows="10" placeholder="Full memory content"></textarea>
        </label>
        <div class="mt-4 flex items-center justify-end gap-3 [&>span]:flex-1 [&>span]:text-[13px] [&>span]:text-[var(--muted)]">
          <span>{{ selected ? `#${selected.id}` : '' }}</span>
          <button class="rounded-lg bg-[#f3f3f4] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink2)] transition-colors hover:bg-[#eef4fe] hover:text-[var(--accent-d)]" type="button" @click="resetForm(); setListNav()">Cancel</button>
          <button class="rounded-lg border border-[var(--accent-d)] bg-[var(--accent-d)] px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2563eb] disabled:cursor-default disabled:bg-[#cfd3da]" type="submit" :disabled="saving || !form.title.trim()">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
