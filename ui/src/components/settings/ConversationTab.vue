<template>
  <section class="space-y-3">
    <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">对话</span>
    <div class="rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/60 p-4 space-y-2">
      <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer">
        <input
          type="checkbox"
          :checked="enableFollowupSuggestions"
          @change="$emit('update:enable-followup-suggestions', $event.target.checked)"
          class="cursor-pointer"
        />
        是否开启后续建议
      </label>
      <div class="text-xs text-neutral-400 leading-relaxed">
        开启后，AI 会在回答结尾输出 <code class="px-1 rounded bg-gray-200 dark:bg-neutral-700">&lt;suggestions&gt;</code> 标签，包含 3 条后续追问建议，点击可填充输入框。
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">保存</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  enableFollowupSuggestions: { type: Boolean, default: true }
});

defineEmits(['update:enable-followup-suggestions', 'save']);
</script>
