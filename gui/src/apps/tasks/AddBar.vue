<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  submitting: { type: Boolean, default: false }
});
defineEmits(['update:modelValue', 'submit']);
</script>

<template>
  <form
    class="my-2 flex items-center gap-3 rounded-md border border-line bg-card px-4 py-3 transition-all focus-within:!border-accent focus-within:shadow-[0_0_18px_rgba(0,229,255,0.12)]"
    @submit.prevent="$emit('submit')">
    <span class="msi"
      :class="submitting ? 'text-faint' : 'text-accent'">
      {{ submitting ? 'hourglass_top' : 'add' }}
    </span>
    <input
      class="flex-1 border-0 bg-transparent font-mono text-[13px] text-ink outline-0 placeholder:text-faint disabled:text-faint"
      :value="modelValue"
      :disabled="submitting"
      :placeholder="submitting ? '创建中...' : '输入任务指令，Enter 交给 AI 执行'"
      @input="$emit('update:modelValue', $event.target.value)" />
  </form>
</template>
