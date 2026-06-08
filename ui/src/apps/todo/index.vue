<template>
  <div class="flex h-full min-h-0 flex-col" :style="bgStyle">
    <div class="m-3 rounded-[14px] px-3 py-2" :style="panelStyle">
      <div class="flex items-center gap-2">
        <input
          v-model="draft"
          class="h-9 min-w-0 flex-1 border-0 bg-transparent text-[14px] text-[#3a2415] outline-none placeholder:text-[#9a8060]"
          placeholder="添加待办..."
          @keyup.enter="add"
        />
        <button
          class="grid size-8 place-items-center rounded-[9px] text-[18px] font-bold active:translate-y-[1px]"
          :style="buttonStyle"
          :disabled="!draft.trim()"
          @click="add"
        >+</button>
      </div>
      <div class="mt-1 text-[11px] text-[#9a8060]">智能分解由任务能力处理</div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-5 [scrollbar-width:none]">
      <div v-if="!todos.length" class="py-16 text-center text-[13px] text-[#a09080]">还没有待办</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="todo in todos" :key="todo.id" class="flex items-center gap-3 rounded-[14px] px-3.5 py-3" :style="panelStyle">
          <button class="grid size-6 shrink-0 place-items-center rounded-[8px] border border-[rgba(120,90,40,0.2)] bg-white/60 text-[14px] text-[#4a8a50]" @click="toggle(todo)">
            {{ todo.done ? '✓' : '' }}
          </button>
          <div class="min-w-0 flex-1 text-[13.5px] text-[#3a2415]" :class="{ 'line-through opacity-50': todo.done }">{{ todo.text }}</div>
          <button class="text-[11px] font-bold text-[#9a3a2a]" @click="remove(todo.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const todos = ref([]);
const draft = ref('');

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

const load = async () => {
  const data = await request('/apps/todo/todos');
  todos.value = data.todos || [];
};

const add = async () => {
  const text = draft.value.trim();
  if (!text) return;
  await request('/apps/todo/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  draft.value = '';
  await load();
};

const toggle = async (todo) => {
  await request(`/apps/todo/todos?id=${encodeURIComponent(todo.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done: !todo.done }),
  });
  await load();
};

const remove = async (id) => {
  await request(`/apps/todo/todos?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
