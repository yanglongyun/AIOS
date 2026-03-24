<template>
  <div
    v-show="win.state !== 'minimized'"
    :style="windowStyle"
    class="window-frame fixed"
    @mousedown="onFocus"
  >
    <!-- 内部容器：裁剪圆角，resize 热区在外层不受影响 -->
    <div class="flex h-full w-full flex-col overflow-hidden" :class="win.state !== 'maximized' ? 'rounded-[10px]' : ''">
      <!-- 标题栏 -->
      <div
        class="title-bar flex h-9 shrink-0 cursor-default items-center border-b border-black/[0.08] px-3"
        @mousedown.left="startDrag"
        @dblclick="toggleMaximize"
      >
        <!-- 左侧红绿灯 -->
        <div class="traffic-lights mr-3 flex items-center gap-[7px]">
          <button @click.stop="doClose" class="traffic-dot flex h-[13px] w-[13px] cursor-pointer items-center justify-center rounded-full border-none bg-[#ff5f57] transition-opacity" title="关闭">
            <svg class="traffic-icon" viewBox="0 0 8 8" width="8" height="8"><path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="#4a0000" stroke-width="1.2" fill="none"/></svg>
          </button>
          <button @click.stop="doMinimize" class="traffic-dot flex h-[13px] w-[13px] cursor-pointer items-center justify-center rounded-full border-none bg-[#febc2e] transition-opacity" title="最小化">
            <svg class="traffic-icon" viewBox="0 0 8 8" width="8" height="8"><line x1="1" y1="4" x2="7" y2="4" stroke="#995700" stroke-width="1.2"/></svg>
          </button>
          <button @click.stop="toggleMaximize" class="traffic-dot flex h-[13px] w-[13px] cursor-pointer items-center justify-center rounded-full border-none bg-[#28c840] transition-opacity" :title="win.state === 'maximized' ? '还原' : '最大化'">
            <svg class="traffic-icon" viewBox="0 0 8 8" width="8" height="8"><path d="M1.5 5.5L4 2l2.5 3.5" stroke="#006500" stroke-width="1.2" fill="none"/></svg>
          </button>
        </div>
        <span class="flex-1 truncate text-center text-xs font-semibold text-[#4a3a28]">{{ win.title }}</span>
        <!-- 右侧聊天按钮 -->
        <button v-if="sideChatEnabled" @click.stop="showSideChat = !showSideChat" class="ml-3 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[5px] border-none bg-transparent transition-all duration-100 hover:bg-black/[0.06]" :class="showSideChat ? 'text-[#c8a060]' : 'text-[#8a7a68] hover:text-[#5a4a38]'" title="侧边对话">
          <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 2h8a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4l-2 2V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
        </button>
      </div>

      <!-- 内容区 -->
      <div class="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#2a2218]">
        <component :is="win.component" v-bind="win.props" />
        <!-- 聊天小面板 -->
        <div v-if="sideChatEnabled && showSideChat" class="absolute right-2 top-2 bottom-[30%] z-10 flex w-80 flex-col overflow-hidden rounded-lg border border-[#3a2010] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <ChatPanel @close="showSideChat = false" />
        </div>
      </div>
    </div>

    <!-- 缩放边框：四边 + 四角（在外层，不被 overflow-hidden 裁剪） -->
    <template v-if="win.state !== 'maximized'">
      <div class="absolute right-[-4px] top-2 bottom-2 w-2 cursor-ew-resize" @mousedown.stop.prevent="startResize($event, 'r')" />
      <div class="absolute bottom-[-4px] left-2 right-2 h-2 cursor-ns-resize" @mousedown.stop.prevent="startResize($event, 'b')" />
      <div class="absolute left-[-4px] top-2 bottom-2 w-2 cursor-ew-resize" @mousedown.stop.prevent="startResize($event, 'l')" />
      <div class="absolute top-[-4px] left-2 right-2 h-2 cursor-ns-resize" @mousedown.stop.prevent="startResize($event, 't')" />
      <div class="absolute bottom-[-4px] right-[-4px] h-3.5 w-3.5 cursor-se-resize" @mousedown.stop.prevent="startResize($event, 'br')" />
      <div class="absolute bottom-[-4px] left-[-4px] h-3.5 w-3.5 cursor-sw-resize" @mousedown.stop.prevent="startResize($event, 'bl')" />
      <div class="absolute top-[-4px] right-[-4px] h-3.5 w-3.5 cursor-ne-resize" @mousedown.stop.prevent="startResize($event, 'tr')" />
      <div class="absolute top-[-4px] left-[-4px] h-3.5 w-3.5 cursor-nw-resize" @mousedown.stop.prevent="startResize($event, 'tl')" />
    </template>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { windowManager } from '../../stores/windowManager.ts';
import { appRegistry } from '../../apps.ts';
import ChatPanel from '../ChatPanel.vue';

const props = defineProps({ win: { type: Object, required: true } });

const showSideChat = ref(false);
const sideChatEnabled = computed(() => {
  const app = appRegistry.find(a => a.id === props.win.appId);
  return app?.sideChat !== false;
});

const windowStyle = computed(() => {
  const w = props.win;
  if (w.state === 'maximized') {
    return { left: 0, top: 0, width: '100vw', height: 'calc(100vh - 46px)', zIndex: w.zIndex, borderRadius: 0, border: 'none' };
  }
  return {
    left: w.x + 'px', top: w.y + 'px',
    width: w.w + 'px', height: w.h + 'px',
    zIndex: w.zIndex
  };
});

function onFocus() {
  windowManager.focus(props.win.id);
}

function toggleMaximize() {
  windowManager.maximize(props.win.id);
}

function doMinimize() {
  windowManager.minimize(props.win.id);
}

function doClose() {
  windowManager.close(props.win.id);
}

// 拖拽
let dragOffset = null;
function startDrag(e) {
  if (props.win.state === 'maximized') return;
  dragOffset = { x: e.clientX - props.win.x, y: e.clientY - props.win.y };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  windowManager.focus(props.win.id);
}

function onDrag(e) {
  const x = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 100));
  const y = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 40));
  windowManager.updatePosition(props.win.id, x, y);
}

function stopDrag() {
  dragOffset = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// 缩放（支持8个方向）
let resizeState = null;

function startResize(e, direction) {
  resizeState = {
    dir: direction,
    startX: e.clientX,
    startY: e.clientY,
    origX: props.win.x,
    origY: props.win.y,
    origW: props.win.w,
    origH: props.win.h
  };
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  windowManager.focus(props.win.id);
}

function onResize(e) {
  const s = resizeState;
  const dx = e.clientX - s.startX;
  const dy = e.clientY - s.startY;
  const win = props.win;

  let newX = s.origX, newY = s.origY, newW = s.origW, newH = s.origH;

  if (s.dir.includes('r')) newW = s.origW + dx;
  if (s.dir.includes('b')) newH = s.origH + dy;
  if (s.dir.includes('l')) { newW = s.origW - dx; newX = s.origX + dx; }
  if (s.dir.includes('t')) { newH = s.origH - dy; newY = s.origY + dy; }

  if (newW < win.minW) {
    if (s.dir.includes('l')) newX = s.origX + s.origW - win.minW;
    newW = win.minW;
  }
  if (newH < win.minH) {
    if (s.dir.includes('t')) newY = s.origY + s.origH - win.minH;
    newH = win.minH;
  }

  windowManager.updatePosition(win.id, newX, newY);
  windowManager.updateSize(win.id, newW, newH);
}

function stopResize() {
  resizeState = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}
</script>

<style scoped>
/* 多层 shadow + 半透明 border + 渐变 — 必须原生 */
.window-frame {
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: 0 8px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1);
}

.title-bar {
  background: linear-gradient(180deg, #f5ece0 0%, #e8dcc8 100%);
}

.traffic-icon {
  opacity: 0;
  transition: opacity 0.15s;
}
.traffic-lights:hover .traffic-icon {
  opacity: 1;
}

</style>
