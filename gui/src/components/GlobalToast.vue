<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-[-8px] opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-[-8px] opacity-0"
  >
    <div
      v-if="toast.state.visible"
      class="fixed left-1/2 top-14 z-[120] -translate-x-1/2 rounded-lg border px-3 py-2 text-xs shadow-[0_6px_18px_rgba(0,0,0,0.35)] backdrop-blur-sm"
      :class="toast.state.type === 'error'
        ? 'border-[#7a2f2f] bg-[rgba(90,30,30,0.9)] text-[#ffd7d7]'
        : 'border-[#4a3828] bg-[rgba(46,32,20,0.92)] text-[#e8d0a8]'"
    >
      {{ toast.state.message }}
    </div>
  </Transition>
</template>

<script setup>
import { toast } from '../stores/toast.js';
</script>
