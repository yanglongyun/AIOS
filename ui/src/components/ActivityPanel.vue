<template>
  <div class="fixed inset-0 z-[90]" @click.self="$emit('close')">
    <div class="absolute right-4 top-12 z-[91] flex max-h-[70vh] w-72 flex-col overflow-hidden rounded-lg border border-[#3a2010] bg-[#2e2014] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

      <!-- 顶部：表情 + 状态 -->
      <div class="flex items-center gap-3 border-b border-[#4a3828] px-4 py-3">
        <div class="relative text-[38px] leading-none">
          {{ avatarEmoji }}
          <span v-if="avatarBurst" class="pointer-events-none absolute -top-3 -right-1 text-sm animate-bounce">{{ avatarBurst }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-bold tracking-wide text-[#e8d0a8]">{{ avatarName || 'AIOS' }}</div>
          <div class="mt-0.5 text-[11px]" :class="hasPending ? 'text-[#c8a060]' : 'text-[#6a5840]'">
            {{ hasPending ? `处理中 · ${pendingCount} 个任务` : '空闲中' }}
          </div>
        </div>
      </div>

      <!-- 中部：最近动态 -->
      <div class="flex items-center justify-between px-4 pt-2.5 pb-1">
        <span class="text-[10px] font-bold tracking-[0.08em] text-[#5a4830] uppercase">最近动态</span>
        <button type="button" class="text-[10px] text-[#6a5840] transition-colors hover:text-[#c8a060] cursor-pointer" @click="openAllTasks">查看全部</button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="previewTasks.length === 0" class="px-4 py-6 text-center text-xs text-[#5a4830]">暂无动态</div>
        <button
          v-for="r in previewTasks"
          :key="r.id"
          type="button"
          class="block w-full cursor-pointer border-b border-[#3a2818] px-4 py-2.5 text-left transition-colors hover:bg-[#3a2a1c] last:border-b-0"
          @click="openTask(r.id)"
        >
          <div class="flex items-center gap-2">
            <span class="rounded bg-[#4a3828] px-1.5 py-0.5 text-[10px] text-[#c8a060]">{{ r.app }}</span>
            <span class="text-[10px]" :class="r.status === 'done' ? 'text-[#7a9a6a]' : r.status === 'error' ? 'text-[#c07060]' : 'text-[#c8a060]'">{{ r.status }}</span>
            <span class="ml-auto text-[10px] text-[#5a4830]">{{ formatTime(r.created_at) }}</span>
          </div>
          <div class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#a89070]">{{ r.response || r.prompt?.slice(0, 80) }}</div>
        </button>
      </div>

      <!-- 底部：开关 -->
      <div class="flex gap-3 border-t border-[#4a3828] px-4 py-3">
        <button
          type="button"
          class="flex flex-1 cursor-pointer items-center justify-between rounded-md px-3 py-2 text-[11px] transition-colors"
          :class="enableAvatarEmoji ? 'bg-[#3a2a10] text-[#c8a860]' : 'bg-white/5 text-[#6a5840]'"
          @click="$emit('toggle-emoji', !enableAvatarEmoji)"
        >
          <span>表情变化</span>
          <span class="relative inline-flex h-4 w-7 items-center rounded-full transition-colors" :class="enableAvatarEmoji ? 'bg-[#c8a860]' : 'bg-[#3a2a1a]'">
            <span class="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform" :class="enableAvatarEmoji ? 'translate-x-3.5' : 'translate-x-0.5'" />
          </span>
        </button>
        <button
          type="button"
          class="flex flex-1 cursor-pointer items-center justify-between rounded-md px-3 py-2 text-[11px] transition-colors"
          :class="enableAvatarSound ? 'bg-[#3a2a10] text-[#c8a860]' : 'bg-white/5 text-[#6a5840]'"
          @click="$emit('toggle-sound', !enableAvatarSound)"
        >
          <span>音效</span>
          <span class="relative inline-flex h-4 w-7 items-center rounded-full transition-colors" :class="enableAvatarSound ? 'bg-[#c8a860]' : 'bg-[#3a2a1a]'">
            <span class="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform" :class="enableAvatarSound ? 'translate-x-3.5' : 'translate-x-0.5'" />
          </span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  avatarEmoji:       { type: String,  default: '🙂' },
  avatarBurst:       { type: String,  default: '' },
  avatarName:        { type: String,  default: 'AIOS' },
  enableAvatarEmoji: { type: Boolean, default: true },
  enableAvatarSound: { type: Boolean, default: false },
  tasks:             { type: Array,   default: () => [] },
  hasPending:        { type: Boolean, default: false },
});

defineEmits(['close', 'toggle-emoji', 'toggle-sound']);

const previewTasks = computed(() => Array.isArray(props.tasks) ? props.tasks.slice(0, 5) : []);
const pendingCount = computed(() => previewTasks.value.filter(r => r.status === 'pending').length);

const openTask = async (id) => {
  if (!id) return;
  await router.push(`/task/${id}`);
};
const openAllTasks = async () => {
  await router.push('/tasks');
};
const formatTime = (t) => {
  if (!t) return '';
  return String(t).slice(11, 16);
};
</script>
