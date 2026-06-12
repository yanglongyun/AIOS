<template>
  <div class="note" :style="noteStyle(note)" @click="$emit('open', note)">
    <span class="tape" :style="{ background: accentOf(note.color) + '4d' }"></span>
    <h3>{{ note.title || '__T_NOTEPAD_UNTITLED__' }}</h3>
    <p v-html="snippet(note.content)"></p>
    <div class="ft">
      <i v-for="tag in note.tags.slice(0, 2)" :key="tag" :style="{ color: accentOf(note.color), background: 'transparent', border: '1px solid ' + accentOf(note.color) + '55' }">#{{ tag }}</i>
      <span style="margin-left:auto">{{ timeAgo(note.updated_at) }}</span>
    </div>
  </div>
</template>

<script setup>
import { accentOf, noteStyle, snippet, timeAgo } from '../lib/format.js';

defineProps({
  note: { type: Object, required: true },
});
defineEmits(['open']);
</script>

<style scoped>
.note{position:relative;break-inside:avoid;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow);padding:18px 16px 14px;margin-bottom:12px;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
.note:hover{transform:translateY(-3px) rotate(0deg) !important;box-shadow:0 8px 20px rgba(60,60,80,.12)}
.note .tape{position:absolute;top:-5px;left:14px;width:24px;height:10px;border-radius:2px;background:rgba(255,255,255,.55);transform:rotate(-3deg);box-shadow:0 1px 2px rgba(0,0,0,.06)}
.note h3{font-size:14px;margin-bottom:6px;color:var(--color-ink)}
.note p{font-size:12.5px;color:var(--color-muted);line-height:1.6;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical;overflow:hidden}
.note .ft{display:flex;gap:6px;margin-top:10px;font-size:11px;color:var(--muted)}
.note .ft i{font-style:normal;border-radius:999px;padding:1px 8px;font-weight:600}
</style>
