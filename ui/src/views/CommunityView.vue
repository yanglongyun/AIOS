<template>
  <div class="h-full w-full p-4 md:p-6">
    <div class="h-full w-full max-w-7xl mx-auto flex flex-col rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
      <div class="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between gap-3">
        <div>
          <h1 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">社区</h1>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">在 AIOS 内嵌访问社区</p>
        </div>
        <button
          class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800"
          @click="openInNewTab"
        >
          新窗口打开
        </button>
      </div>

      <iframe
        class="w-full flex-1 bg-white"
        :src="communityUrl"
        title="community"
        referrerpolicy="no-referrer"
      />
    </div>
  </div>
</template>

<script setup>
const communityUrl = localStorage.getItem('communityUrl') || 'https://aios.chatnext.ai';

const openInNewTab = () => {
  window.open(communityUrl, '_blank', 'noopener,noreferrer');
};
</script>
