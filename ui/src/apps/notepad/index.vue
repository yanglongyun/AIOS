<template>
  <div class="flex h-full min-h-0 flex-col" :style="bgStyle">
    <div class="m-3 rounded-[14px] px-3 py-2" :style="panelStyle">
      <textarea
        v-model="draft"
        rows="4"
        class="min-h-[86px] w-full resize-none border-0 bg-transparent text-[14px] leading-relaxed text-[#3a2415] outline-none placeholder:text-[#9a8060]"
        placeholder="写点什么..."
      />
      <div class="mt-2 flex items-center gap-2">
        <button
          class="rounded-[10px] px-3 py-1.5 text-[12px] font-bold text-[#3a2415] active:translate-y-[1px]"
          :style="buttonStyle"
          :disabled="!draft.trim()"
          @click="save"
        >保存</button>
        <span class="text-[11px] text-[#9a8060]">智能润色由任务能力处理</span>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-5 [scrollbar-width:none]">
      <div v-if="!notes.length" class="py-16 text-center text-[13px] text-[#a09080]">还没有笔记</div>
      <div v-else class="flex flex-col gap-2">
        <article v-for="note in notes" :key="note.id" class="rounded-[14px] px-3.5 py-3" :style="panelStyle">
          <div class="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#3a2415]">{{ note.content || note.title }}</div>
          <div class="mt-2 flex items-center gap-2 border-t border-[rgba(120,90,40,0.10)] pt-2">
            <span class="flex-1 font-sans text-[10.5px] text-[#a08a68]">{{ note.updated_at || note.created_at }}</span>
            <button class="text-[11px] font-bold text-[#9a3a2a]" @click="remove(note.id)">删除</button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const notes = ref([]);
const draft = ref('');

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const load = async () => {
  const data = await request('/apps/notepad/notes');
  notes.value = data.notes || [];
};

const save = async () => {
  const content = draft.value.trim();
  if (!content) return;
  await request('/apps/notepad/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: content.slice(0, 24), content }),
  });
  draft.value = '';
  await load();
};

const remove = async (id) => {
  await request(`/apps/notepad/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  await load();
};

onMounted(load);

const bgStyle = {
  background: 'linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)',
};
const panelStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)',
  boxShadow: '0 2px 8px rgba(90,60,20,0.1),inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(180,150,80,0.18)',
};
const buttonStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 3px 0 #6a4800,0 4px 10px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,215,80,0.35)',
  color: 'rgba(255,245,190,0.95)',
};
</script>
