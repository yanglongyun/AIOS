<template>
  <div class="top-shell shrink-0" :style="shellStyle">
    <div class="top-status-layer" :style="statusLayerStyle"></div>
    <div class="top-toolbar flex items-center gap-2 px-3" :style="toolbarStyle">
      <!-- Back button mode -->
      <template v-if="nav.back">
        <button class="top-btn" :style="btnStyle" @click="nav.back" v-html="backSvg"></button>
        <div class="flex-1 truncate text-[15px] font-bold" :style="titleStyle">{{ nav.title }}</div>
        <button
          v-if="nav.rightAction"
          class="top-btn"
          :style="btnStyle"
          @click="nav.rightAction.fn"
          v-html="actionSvg(nav.rightAction)"
        ></button>
        <div v-else class="w-[34px] shrink-0"></div>
      </template>

      <!-- Custom title mode: chat/tasks can provide left + right actions -->
      <template v-else-if="nav.title">
        <button
          v-if="nav.leftAction"
          class="top-btn"
          :style="btnStyle"
          @click="nav.leftAction.fn"
          v-html="actionSvg(nav.leftAction)"
        ></button>
        <div v-else class="w-[34px] shrink-0"></div>
        <div class="flex-1 truncate text-center text-[15px] font-bold" :style="titleStyle">{{ nav.title }}</div>
        <button
          v-if="nav.rightAction"
          class="top-btn"
          :style="btnStyle"
          @click="nav.rightAction.fn"
          v-html="actionSvg(nav.rightAction)"
        ></button>
        <div v-else class="w-[34px] shrink-0"></div>
      </template>

      <!-- App open mode -->
      <template v-else-if="app">
        <span class="mr-1 shrink-0 text-[22px] leading-none">{{ appIcon }}</span>
        <div class="flex-1 truncate text-[15px] font-bold" :style="titleStyle">{{ appTitle }}</div>
        <button class="top-btn" :style="btnStyle" @click="$emit('close')" v-html="closeSvg"></button>
      </template>

      <!-- Default: tab title -->
      <template v-else>
        <div class="flex-1 text-center text-[15px] font-bold" :style="brandStyle">{{ tabTitle || 'AIOS' }}</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { apps as appRegistry } from '../../apps.js';

const props = defineProps({
  app:      { type: Object, default: null },
  nav:      { type: Object, required: true },
  tabTitle: { type: String, default: '' },
});
defineEmits(['close']);

const appTitle = computed(() => appRegistry.find(r => r.id === props.app?.appId)?.name || '');
const appIcon  = computed(() => appRegistry.find(r => r.id === props.app?.appId)?.icon || '');

const shellStyle = {
  background: '#140b04',
  boxShadow: '0 3px 12px rgba(0,0,0,0.42)',
};
const statusLayerStyle = {
  height: 'env(safe-area-inset-top, 0px)',
  background: 'linear-gradient(180deg,#170d05 0%,#241405 100%)',
  boxShadow: 'inset 0 -1px 0 rgba(255,220,150,0.05)',
};
const toolbarStyle = {
  height: '52px',
  background: 'repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(255,255,255,0.014) 4px,rgba(255,255,255,0.014) 8px),linear-gradient(180deg,#4a3214 0%,#33200b 48%,#211306 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,230,170,0.10),inset 0 -1px 0 rgba(0,0,0,0.48),0 2px 8px rgba(0,0,0,0.34)',
};
const btnStyle = {
  background: 'linear-gradient(180deg,rgba(255,255,255,0.08) 0%,rgba(0,0,0,0.2) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1),inset 0 -1px 0 rgba(0,0,0,0.3),0 2px 4px rgba(0,0,0,0.3)',
  color: 'rgba(255,220,160,0.85)',
};
const titleStyle = {
  color: 'rgba(255,230,170,0.92)',
  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
};
const brandStyle = {
  color: 'rgba(255,230,170,0.92)',
  textShadow: '0 1px 3px rgba(0,0,0,0.6),0 0 16px rgba(200,160,60,0.25)',
  letterSpacing: '1px',
};

const svgAttrs = 'viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const backSvg = `<svg ${svgAttrs}><polyline points="15 18 9 12 15 6"/></svg>`;
const closeSvg = `<svg ${svgAttrs} width="17" height="17"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const iconMap = {
  history: `<svg ${svgAttrs}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>`,
  add: `<svg ${svgAttrs}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  more_vert: `<svg ${svgAttrs}><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
};

function actionSvg(action) {
  return action?.svg || iconMap[action?.icon] || iconMap.more_vert;
}
</script>

<style scoped>
.top-btn {
  display: flex;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  padding: 0;
}
.top-btn:active {
  opacity: .6;
}
</style>
