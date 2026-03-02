<template>
  <div class="pointer-events-none w-full px-3 pb-4 sm:px-4">
    <div
      class="pointer-events-auto flex w-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.16)] transition-all duration-500 dark:bg-neutral-900"
      :style="{ height: isOpen ? '80vh' : 'auto' }"
    >
      <div v-if="isOpen" class="flex w-full cursor-pointer justify-center pb-1 pt-3" @click="$emit('toggle')">
        <div class="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-neutral-700" />
      </div>

      <div v-if="isOpen" ref="chatContainer" class="flex-1 overflow-y-auto bg-gray-50/60 px-4 pb-4 dark:bg-neutral-800/30">
        <div class="space-y-4 pb-2">
          <div v-for="(msg, idx) in messages" :key="idx" class="flex flex-col gap-1">
            <div v-if="msg.role === 'user'" class="select-text self-end max-w-[85%] rounded-2xl rounded-tr-sm bg-stone-800 px-4 py-2 text-white shadow-sm dark:bg-neutral-100 dark:text-neutral-900">
              {{ msg.content[0].text }}
            </div>
            <div v-else-if="msg.role === 'assistant'" class="prose prose-sm max-w-[90%] select-text self-start rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 text-gray-800 shadow-sm dark:prose-invert dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
              <div class="mb-1 text-[10px] uppercase tracking-wider text-neutral-400">{{ msg.mode === 'local' ? '局部重写' : '全局重写' }}</div>
              <div v-html="renderMarkdown(msg.content[0].text)" />
            </div>
          </div>

          <div v-if="loading" class="self-start rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div class="flex gap-1">
              <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 0ms" />
              <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 150ms" />
              <div class="h-2 w-2 animate-bounce rounded-full bg-gray-400" style="animation-delay: 300ms" />
            </div>
          </div>
        </div>
      </div>

      <div class="border border-stone-200 bg-stone-50/60 p-2 dark:border-neutral-700 dark:bg-neutral-900/80" :class="{ 'border-t border-gray-100 dark:border-neutral-700': isOpen }">
        <div class="flex items-end gap-2">
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-all duration-300 hover:bg-gray-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
            :class="{ 'bg-gray-200 dark:bg-neutral-700': isOpen }"
            @click="$emit('toggle')"
          >
            <X v-if="isOpen" class="h-6 w-6" />
            <MessageSquare v-else class="h-6 w-6" />
          </button>

          <textarea
            ref="textareaRef"
            v-model="localInput"
            rows="1"
            class="max-h-32 min-h-[40px] flex-1 resize-none border-none bg-transparent px-2 py-2 text-gray-800 outline-none focus:ring-0 dark:text-neutral-100"
            placeholder="输入重写要求..."
            :disabled="loading"
            @input="handleInput"
            @keydown.enter.prevent="handleEnter"
          />

          <button
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200"
            :class="localInput.trim() && !loading ? 'cursor-pointer bg-stone-800 text-white shadow-sm hover:bg-stone-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200' : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-neutral-700 dark:text-neutral-500'"
            @click="handleSend"
          >
            <Send v-if="!loading" class="h-5 w-5" />
            <div v-else class="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { marked } from 'marked';
import { MessageSquare, Send, X } from 'lucide-vue-next';

const props = defineProps({
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  isOpen: { type: Boolean, default: false },
  modelValue: { type: String, default: '' }
});

const emit = defineEmits(['toggle', 'update:modelValue', 'send']);
const chatContainer = ref(null);
const textareaRef = ref(null);

const localInput = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const renderMarkdown = (text = '') => marked.parse(String(text));

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });
};

const adjustHeight = () => {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
};

const handleInput = () => adjustHeight();
const handleEnter = (e) => { if (!e.shiftKey) handleSend(); };
const handleSend = () => {
  if (!localInput.value.trim() || props.loading) return;
  emit('send');
  nextTick(() => {
    if (textareaRef.value) textareaRef.value.style.height = 'auto';
  });
};

watch(() => props.messages.length, scrollToBottom);
watch(() => props.messages[props.messages.length - 1]?.content?.[0]?.text, scrollToBottom);
watch(() => props.isOpen, (open) => { if (open) scrollToBottom(); });
</script>
