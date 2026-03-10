<template>
  <div class="lcd-screen">
    <div v-if="isLoading" class="lcd-content lcd-loading">
      <div>{{ toast }}<span class="blink-cursor">▮</span></div>
      <div class="lcd-progress">
        <span class="lcd-progress-bar"></span>
      </div>
    </div>
    <div v-else-if="homePage" class="lcd-content home-img">
      <img src="/nokia/hand.png" />
    </div>
    <div v-else-if="timeLine.length > 0" class="lcd-content" v-html="timeLine[currentIndex].content"></div>
  </div>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, required: true },
  toast: { type: String, required: true },
  homePage: { type: Boolean, required: true },
  timeLine: { type: Array, required: true },
  currentIndex: { type: Number, required: true }
});
</script>
