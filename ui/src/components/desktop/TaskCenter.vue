<template>
  <Teleport to="body">
  <div class="fixed inset-x-0 top-0 bottom-[44px] z-[199]" @click.self="$emit('close')">
    <div class="absolute right-0 top-0 bottom-0 flex w-[380px] flex-col border-l border-[rgba(200,170,130,0.3)] bg-[rgba(250,245,238,0.96)] shadow-[-4px_0_24px_rgba(90,62,40,0.12)] backdrop-blur-2xl">
      <!-- 顶栏 -->
      <div class="flex items-center justify-between border-b border-[rgba(200,170,130,0.25)] px-4 py-3">
        <span class="text-[13px] font-bold text-[#3a2a18]">{{ t('app_sidebar_tasks') }}</span>
        <button @click="$emit('close')" class="flex h-6 w-6 items-center justify-center rounded-md text-[#9a8870] transition-colors hover:bg-black/5 hover:text-[#5a4a38]">
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- 任务列表 -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="!tasks.length" class="py-16 text-center text-[13px] text-[#a09080]">暂无任务</div>
        <div
          v-for="task in tasks"
          :key="task.id"
          class="flex items-start gap-3 border-b border-[rgba(200,170,130,0.15)] px-4 py-3 transition-colors hover:bg-[rgba(200,160,96,0.06)]"
          @click="openTask(task)"
        >
          <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
            <span v-if="task.status === 'running'" class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#c8a060]"></span>
            <span v-else-if="task.status === 'done'" class="text-[12px] text-[#6a9a4a]">✓</span>
            <span v-else-if="task.status === 'error'" class="text-[12px] text-[#c04040]">✗</span>
            <span v-else class="h-2 w-2 rounded-full border border-[#c0b098]"></span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-[13px] text-[#3a2a18]">{{ task.title || '未命名任务' }}</div>
            <div class="mt-0.5 flex items-center gap-2 text-[11px] text-[#a09080]">
              <span>{{ task.created_at }}</span>
              <span v-if="task.app" class="rounded bg-[rgba(200,160,96,0.12)] px-1.5 py-0.5 text-[10px] text-[#8a6a40]">{{ task.app }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { X } from 'lucide-vue-next';
import { windowManager } from '../../stores/windowManager.js';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
defineEmits(['close']);

const tasks = ref([]);

async function fetchTasks() {
  try {
    const res = await fetch('/aios/api/task?limit=30');
    tasks.value = await res.json();
  } catch { tasks.value = []; }
}

function openTask(task) {
  windowManager.open('task-detail', { id: String(task.id) });
}

onMounted(fetchTasks);
</script>
