<template>
  <div class="outline-node" :style="{ paddingLeft: (level * 20) + 'px' }">
    <div 
      class="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 group"
      :class="{ 'bg-blue-50 dark:bg-blue-900/20': isEditing }"
    >
      <!-- 展开/收起 -->
      <button 
        v-if="node.children?.length > 0"
        @click="expanded = !expanded"
        class="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
      >
        <svg 
          class="w-4 h-4 transition-transform" 
          :class="{ 'rotate-90': expanded }"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
      <span v-else class="w-6"></span>

      <!-- 节点内容 -->
      <input
        v-if="isEditing"
        v-model="editValue"
        @keydown.enter="saveEdit"
        @keydown.escape="cancelEdit"
        @blur="saveEdit"
        ref="editInput"
        class="flex-1 px-2 py-1 bg-white dark:bg-neutral-900 border border-blue-500 rounded outline-none"
      />
      <span 
        v-else 
        class="flex-1 cursor-pointer"
        @dblclick="startEdit"
      >
        {{ node.topic }}
      </span>

      <!-- 操作按钮 -->
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- 添加子主题 -->
        <button 
          @click="$emit('add-child', node.id)"
          class="p-1.5 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded"
          title="添加子主题"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
        
        <!-- 删除 -->
        <button 
          @click="$emit('delete-node', node.id)"
          class="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="删除"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="expanded && node.children?.length > 0">
      <OutlineNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        @add-child="$emit('add-child', $event)"
        @update-topic="$emit('update-topic', $event.id, $event.topic)"
        @delete-node="$emit('delete-node', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
  node: Object,
  level: { type: Number, default: 0 }
});

const emit = defineEmits(['add-child', 'update-topic', 'delete-node']);

const expanded = ref(true);
const isEditing = ref(false);
const editValue = ref('');
const editInput = ref(null);

function startEdit() {
  editValue.value = props.node.topic;
  isEditing.value = true;
  nextTick(() => editInput.value?.focus());
}

function saveEdit() {
  if (editValue.value.trim() && editValue.value !== props.node.topic) {
    emit('update-topic', props.node.id, editValue.value.trim());
  }
  isEditing.value = false;
}

function cancelEdit() {
  isEditing.value = false;
}
</script>
