<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  submitting: { type: Boolean, default: false }
});
defineEmits(['update:modelValue', 'submit']);
</script>

<template>
  <form
    class="flex items-center gap-3 px-4 py-3.5 my-2 rounded-lg border border-line bg-card shadow-1 transition-all hover:shadow-2 focus-within:!border-accent focus-within:!shadow-[0_0_0_3px_var(--accent-soft),_0_1px_3px_rgba(0,215,255,0.10)]"
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
