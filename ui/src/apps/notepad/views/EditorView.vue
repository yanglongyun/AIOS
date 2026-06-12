<template>
  <section class="page">
    <div class="h-row">
      <h2>__T_NOTEPAD_EDIT_TITLE__</h2>
      <button class="del-btn" title="__T_NOTEPAD_DELETE_NOTE__" @click="$emit('remove')">
        <Trash2 :size="15" :stroke-width="1.7" />
      </button>
      <button class="blue-btn" @click="$emit('close')">__T_COMMON_DONE__</button>
    </div>

    <div class="ecard" :style="{ background: note.color || '#ffffff' }">
      <input v-model="note.title" class="title" placeholder="__T_NOTEPAD_UNTITLED__" @input="$emit('schedule-save')" />
      <ColorSwatches :color="note.color || '#ffffff'" @pick="$emit('pick-color', $event)" />
      <textarea
        ref="textarea"
        v-model="note.content"
        class="body"
        placeholder="__T_NOTEPAD_BODY_PLACEHOLDER__"
        @input="$emit('schedule-save')"
      ></textarea>
    </div>

    <div v-if="aiLoading" class="ai-card pending">__T_NOTEPAD_AI_GENERATING__</div>
    <div v-else-if="aiOpen" class="ai-card">
      <div class="ai-out" :class="{ err: aiError }">{{ aiError || aiResult }}</div>
      <div class="ai-acts">
        <button class="primary" :disabled="!aiResult" @click="$emit('adopt')">__T_NOTEPAD_ADOPT__</button>
        <button @click="$emit('dismiss')">__T_COMMON_CLOSE__</button>
      </div>
    </div>

    <AiBar v-model:prompt="aiPrompt" :loading="aiLoading" @submit="$emit('ask')" />
  </section>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { Trash2 } from 'lucide-vue-next';
import ColorSwatches from '../components/ColorSwatches.vue';
import AiBar from '../components/AiBar.vue';

const props = defineProps({
  note: { type: Object, required: true },
  aiLoading: { type: Boolean, default: false },
  aiOpen: { type: Boolean, default: false },
  aiResult: { type: String, default: '' },
  aiError: { type: String, default: '' },
});
const emit = defineEmits(['close', 'remove', 'schedule-save', 'pick-color', 'ask', 'adopt', 'dismiss']);
const aiPrompt = defineModel('aiPrompt', { type: String, default: '' });

const textarea = ref(null);

const insert = (text) => {
  const ta = textarea.value;
  if (!ta || !props.note) return;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  props.note.content = props.note.content.slice(0, s) + text + props.note.content.slice(e);
  nextTick(() => {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = s + text.length;
  });
  emit('schedule-save');
};
const wrap = (mark) => {
  const ta = textarea.value;
  if (!ta || !props.note) return;
  const s = ta.selectionStart;
  const e = ta.selectionEnd;
  const selected = props.note.content.slice(s, e);
  props.note.content = props.note.content.slice(0, s) + mark + selected + mark + props.note.content.slice(e);
  nextTick(() => {
    ta.focus();
    ta.selectionStart = s + mark.length;
    ta.selectionEnd = e + mark.length;
  });
  emit('schedule-save');
};

defineExpose({ insert, wrap });
</script>

<style scoped>
.page{width:min(860px,100%);margin:0 auto;padding:26px 24px 50px}
.h-row{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.h-row h2{font-size:17px;font-weight:700;flex:1;color:var(--ink)}
.blue-btn{padding:8px 18px;border-radius:9px;border:0;background:var(--accent);color:#fff;font-weight:600;font-size:13px;cursor:pointer}
.blue-btn:hover{background:var(--color-accent-hi)}
.del-btn{display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:var(--color-faint);cursor:pointer;transition:background .12s,color .12s}
.del-btn:hover{background:color-mix(in srgb,var(--color-bad) 9%,transparent);color:var(--color-bad)}
.ecard{background:var(--panel);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px 20px;margin-bottom:12px;transition:background .2s}
.title{width:100%;border:0;background:transparent;outline:0;color:var(--color-ink);font-size:22px;font-weight:600;margin-bottom:10px}
.body{width:100%;min-height:46vh;border:0;border-top:1px solid rgba(0,0,0,.07);background:transparent;color:var(--color-ink);outline:0;padding-top:16px;font-size:15px;line-height:1.85;resize:none}
.ai-card{background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);padding:14px 16px;margin-bottom:10px}
.ai-card.pending{color:var(--muted);font-size:13px}
.ai-out{max-height:40vh;overflow:auto;white-space:pre-wrap;line-height:1.85;font-size:14px;color:var(--color-ink)}
.ai-out.err{color:var(--color-bad)}
.ai-acts{display:flex;gap:8px;margin-top:12px}
.ai-acts button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 16px;font-size:12.5px;font-weight:600;color:var(--ink);cursor:pointer}
.ai-acts button:hover{background:var(--color-bg-hi)}
.ai-acts .primary{background:var(--accent);border-color:var(--accent);color:#fff}
.ai-acts .primary:hover{background:var(--color-accent-hi)}
.ai-acts .primary:disabled{opacity:.5;cursor:default}
</style>
