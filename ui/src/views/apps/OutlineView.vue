<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center gap-3 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <button @click="$emit('toggle-sidebar')" class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <h1 class="text-lg font-semibold">智能大纲</h1>
      <button @click="clearAll" class="ml-auto text-sm text-red-500 hover:text-red-600">清空</button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-5">
      <!-- 根节点输入 -->
      <div class="mb-4">
        <div class="flex gap-2">
          <input
            v-model="newRootTopic"
            @keydown.enter="createRootNode"
            placeholder="输入主题，按回车创建..."
            class="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            @click="createRootNode"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            创建
          </button>
        </div>
      </div>

      <!-- 大纲树 -->
      <div class="space-y-2">
        <OutlineNode
          v-for="node in tree"
          :key="node.id"
          :node="node"
          @add-child="handleAddChild"
          @update-topic="handleUpdateTopic"
          @delete-node="handleDeleteNode"
        />
      </div>

      <!-- 空状态 -->
      <div v-if="tree.length === 0" class="text-center text-neutral-400 py-20">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p>输入主题开始创建大纲</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import OutlineNode from '../../components/apps/outline/OutlineNode.vue';

const tree = ref([]);
const newRootTopic = ref('');

const API_BASE = 'http://localhost:9700/api/apps/outline';

async function fetchTree() {
  const res = await fetch(`${API_BASE}/list`);
  const data = await res.json();
  if (data.success) {
    tree.value = data.data;
  }
}

async function createRootNode() {
  if (!newRootTopic.value.trim()) return;
  await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_id: null, topic: newRootTopic.value.trim() })
  });
  newRootTopic.value = '';
  fetchTree();
}

async function handleAddChild(parentId) {
  const topic = prompt('输入子主题:');
  if (!topic?.trim()) return;
  await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_id: parentId, topic: topic.trim() })
  });
  fetchTree();
}

async function handleUpdateTopic(id, topic) {
  await fetch(`${API_BASE}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, topic })
  });
  fetchTree();
}

async function handleDeleteNode(id) {
  if (!confirm('删除此节点及其所有子节点？')) return;
  await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  fetchTree();
}

async function clearAll() {
  if (!confirm('清空所有大纲？')) return;
  for (const node of tree.value) {
    await handleDeleteNode(node.id);
  }
}

onMounted(fetchTree);
</script>
