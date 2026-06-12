<template>
  <div class="flex h-dvh w-screen flex-col overflow-hidden bg-bg">
    <!-- 全局顶栏:系统级最高层(v6 语言) -->
    <TopBar />

    <!-- 当前应用占满剩余空间;布局/居中/点阵由应用自管 -->
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <div v-if="currentApp" class="absolute inset-0 overflow-hidden">
        <Suspense>
          <component :is="currentApp.component" :key="currentApp.id" v-bind="currentApp.props" />
        </Suspense>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import TopBar from './system/panel/TopBar.vue';
import { currentApp, initShell } from './system/shell.js';

onMounted(initShell);
</script>
