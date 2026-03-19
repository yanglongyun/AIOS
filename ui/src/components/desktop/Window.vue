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
        <span class="flex-1 truncate text-xs font-semibold text-[#4a3a28]">{{ win.title }}</span>
        <div class="flex items-center gap-0.5">
          <button @click.stop="doMinimize" class="flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[5px] border-none bg-transparent text-[#8a7a68] transition-all duration-100 hover:bg-black/[0.06] hover:text-[#5a4a38]" title="最小化">
            <svg viewBox="0 0 12 12" width="12" height="12"><line x1="2" y1="9" x2="10" y2="9" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <button @click.stop="toggleMaximize" class="flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[5px] border-none bg-transparent text-[#8a7a68] transition-all duration-100 hover:bg-black/[0.06] hover:text-[#5a4a38]" :title="win.state === 'maximized' ? '还原' : '最大化'">
            <svg v-if="win.state === 'maximized'" viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M3.5 3V2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9.5" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
            <svg v-else viewBox="0 0 12 12" width="12" height="12"><rect x="1.5" y="1.5" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>
          </button>
          <button @click.stop="doClose" class="win-btn-close flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-[5px] border-none bg-transparent text-[#8a7a68] transition-all duration-100 hover:text-white" title="关闭">
            <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
          </button>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="flex min-h-0 flex-1 flex-col overflow-auto bg-[#2a2218]">
        <component :is="win.component" v-bind="win.props" />
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

<script setup>
import { computed } from 'vue';
import { windowManager } from '../../stores/windowManager.js';

const props = defineProps({ win: { type: Object, required: true } });

const windowStyle = computed(() => {
  const w = props.win;
  if (w.state === 'maximized') {
    return { left: 0, top: 0, width: '100vw', height: '100vh', zIndex: w.zIndex, borderRadius: 0, border: 'none' };
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

.win-btn-close:hover {
  background: #e04040;
}

</style>
