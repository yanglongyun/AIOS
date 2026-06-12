<template>
  <section class="page">
    <div class="h-row">
      <h2>记事本</h2>
      <button class="blue-btn" @click="$emit('new')">+ 新笔记</button>
    </div>

    <label class="search">
      <Search :size="15" :stroke-width="1.8" />
      <input v-model="query" placeholder="搜索标题、正文、标签" />
    </label>

    <div v-if="notes.length" class="notes">
      <NoteCard v-for="note in notes" :key="note.id" :note="note" @open="$emit('open', $event)" />
    </div>
    <div v-else class="empty">
      <strong>没有匹配的笔记</strong>
      <p>点右上角「+ 新笔记」写一篇</p>
    </div>
  </section>
</template>

<script setup>
import { Search } from 'lucide-vue-next';
import NoteCard from '../components/NoteCard.vue';

defineProps({
  notes: { type: Array, default: () => [] },
});
defineEmits(['new', 'open']);
const query = defineModel('query', { type: String, default: '' });
</script>

<style scoped>
.page{width:min(860px,100%);margin:0 auto;padding:26px 24px 50px}
.h-row{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.h-row h2{font-size:17px;font-weight:700;flex:1;color:var(--ink)}
.blue-btn{padding:8px 18px;border-radius:9px;border:0;background:var(--accent);color:#fff;font-weight:600;font-size:13px;cursor:pointer}
.blue-btn:hover{background:var(--color-accent-hi)}
.search{display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line2);border-radius:12px;padding:9px 13px;margin-bottom:16px;color:var(--muted)}
.search input{flex:1;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:13.5px}
.notes{column-count:3;column-gap:12px}
@media(max-width:760px){.notes{column-count:2}}
.empty{text-align:center;color:var(--muted);padding:14vh 20px}.empty strong{display:block;color:var(--ink);font-size:16px}
</style>
