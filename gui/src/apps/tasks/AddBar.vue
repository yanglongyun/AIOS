<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  submitting: { type: Boolean, default: false }
});
defineEmits(['update:modelValue', 'submit']);
</script>

<template>
  <form
    class="flex items-center gap-3 px-4 py-3 my-2 rounded border border-line bg-card transition-all focus-within:!border-accent"
    @submit.prevent="$emit('submit')">
    <span class="msi"
      :class="submitting ? 'text-faint' : 'text-accent'">
      {{ submitting ? 'hourglass_top' : 'add' }}
    </span>
    <input
      class="flex-1 border-0 bg-transparent outline-0 text-[14px] text-ink placeholder:text-faint disabled:text-faint"
      :value="modelValue"
      :disabled="submitting"
      :placeholder="submitting ? '创建中…' : '添加任务,Enter 让 AI 立刻去做'"
      @input="$emit('update:modelValue', $event.target.value)" />
  </form>
</template>
