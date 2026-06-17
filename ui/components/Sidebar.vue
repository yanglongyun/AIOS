<script setup>
import { BookOpen, Clock, MonitorSmartphone, ShieldCheck, SquarePen } from '@lucide/vue';
import { onMounted, onUnmounted, ref } from 'vue';
import { apps } from '../apps/registry.js';
import { listConversations } from '../lib/api.js';
import { t } from '../lib/locale.js';

const props = defineProps({
  open: { type: Boolean, default: true },
  isMobile: { type: Boolean, default: false },
});
const emit = defineEmits(['new-chat', 'open-chat', 'open-app', 'tasks', 'memories', 'skills', 'controls', 'settings']);

const chats = ref([]);

async function refresh() {
  try {
    chats.value = await listConversations();
  } catch {
    chats.value = [];
  }
}

function formatChatTitle(chat) {
  return chat?.title || t('nav_new_chat', 'New chat');
}

onMounted(() => {
  refresh();
  window.addEventListener('agent:refresh-chats', refresh);
});

onUnmounted(() => {
  window.removeEventListener('agent:refresh-chats', refresh);
});
</script>

<template>
  <aside
    v-show="props.open"
    :class="[
      'flex min-h-0 w-60 shrink-0 flex-col border-r border-[var(--line)] bg-white',
      props.isMobile ? 'fixed inset-y-0 left-0 z-40 w-[min(280px,82vw)] shadow-[18px_0_50px_-28px_rgba(31,29,32,0.55)]' : '',
    ]"
  >
    <div class="px-0 pb-1 pt-0">
      <div class="mx-0 mb-1 flex h-[52px] items-center gap-2 px-4">
        <img src="/cloud.svg" alt="Agent" class="h-auto w-[30px] shrink-0 select-none" draggable="false" />
        <b class="text-[15px] font-bold tracking-tight">Agent</b>
      </div>
      <div class="grid">
        <button class="flex w-full items-center gap-2.5 overflow-hidden px-3 py-1.5 text-left text-[13.5px] text-[var(--ink2)] transition-colors hover:bg-black/5 whitespace-nowrap text-ellipsis" type="button" @click="emit('new-chat')">
          <SquarePen class="h-[15px] w-[15px] shrink-0 text-[var(--accent-d)]" />
          {{ t('nav_new_chat', 'New chat') }}
        </button>
        <button class="flex w-full items-center gap-2.5 overflow-hidden px-3 py-1.5 text-left text-[13.5px] text-[var(--ink2)] transition-colors hover:bg-black/5 whitespace-nowrap text-ellipsis" type="button" @click="emit('tasks')">
          <Clock class="h-[15px] w-[15px] shrink-0 text-[var(--accent-d)]" />
          {{ t('nav_tasks', 'Tasks') }}
        </button>
        <button class="flex w-full items-center gap-2.5 overflow-hidden px-3 py-1.5 text-left text-[13.5px] text-[var(--ink2)] transition-colors hover:bg-black/5 whitespace-nowrap text-ellipsis" type="button" @click="emit('memories')">
          <BookOpen class="h-[15px] w-[15px] shrink-0 text-[var(--accent-d)]" />
          {{ t('nav_memories', 'Memories') }}
        </button>
        <button class="flex w-full items-center gap-2.5 overflow-hidden px-3 py-1.5 text-left text-[13.5px] text-[var(--ink2)] transition-colors hover:bg-black/5 whitespace-nowrap text-ellipsis" type="button" @click="emit('skills')">
          <ShieldCheck class="h-[15px] w-[15px] shrink-0 text-[var(--accent-d)]" />
          {{ t('nav_skills', 'Skills') }}
        </button>
        <button class="flex w-full items-center gap-2.5 overflow-hidden px-3 py-1.5 text-left text-[13.5px] text-[var(--ink2)] transition-colors hover:bg-black/5 whitespace-nowrap text-ellipsis" type="button" @click="emit('controls')">
          <MonitorSmartphone class="h-[15px] w-[15px] shrink-0 text-[var(--accent-d)]" />
          {{ t('nav_controls', 'Controls') }}
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-0 pb-2 pt-4">
      <div class="mb-1 mt-2.5 flex items-center gap-1.5 px-3 text-[11px] font-medium text-[var(--muted)]">{{ t('nav_apps', 'Apps') }}</div>
      <button
        v-for="app in apps"
        :key="app.id"
        class="flex w-full items-center gap-2.5 overflow-hidden px-3 py-1.5 text-left text-[13px] text-[var(--ink2)] transition-colors hover:bg-black/5 whitespace-nowrap text-ellipsis"
        type="button"
        @click="emit('open-app', app.id)"
      >
        <span class="w-5 shrink-0 text-center text-[15px]">{{ app.icon }}</span>
        {{ app.name }}
      </button>

      <div class="mb-1 mt-6 flex items-center gap-1.5 px-3 text-[11px] font-medium text-[var(--muted)]">{{ t('nav_chats', 'Chats') }}</div>
      <button
        v-for="chat in chats"
        :key="chat.id"
        class="block w-full overflow-hidden px-3 py-1.5 text-left text-[13px] text-[var(--ink2)] transition-colors hover:bg-black/5 whitespace-nowrap text-ellipsis"
        type="button"
        @click="emit('open-chat', chat)"
      >
        {{ formatChatTitle(chat) }}
      </button>
      <div v-if="!chats.length" class="px-3 py-2 text-xs text-[var(--muted)]">{{ t('chat_history_empty', 'No conversations yet') }}</div>
    </div>

    <div class="mt-2 shrink-0 border-t border-[var(--line)]">
      <button class="relative flex w-full items-center gap-2.5 bg-transparent px-4 py-2.5 text-left transition hover:bg-black/5" type="button" @click="emit('settings')">
        <span class="h-[15px] w-[15px] shrink-0 rounded-full bg-[var(--accent-d)]"></span>
        <span>
          <b class="block text-[13.5px] font-medium">{{ t('nav_settings', 'Settings') }}</b>
          <small class="hidden">{{ t('nav_settings_desc', 'Model and system prompt') }}</small>
        </span>
      </button>
    </div>
  </aside>
</template>
