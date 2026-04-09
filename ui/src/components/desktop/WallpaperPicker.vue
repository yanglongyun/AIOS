<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[400]" @click="close">
      <div class="picker absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6" @click.stop>
        <h3 class="mb-4 text-[15px] font-semibold text-[#2c2420]">选择壁纸</h3>
        <div class="grid grid-cols-4 gap-2.5">
        <div
          v-for="wp in wallpapers" :key="wp.id"
          class="group relative h-14 w-20 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent transition-all duration-150 hover:-translate-y-0.5"
          :class="[wp.id, current === wp.id && 'border-[#e08850] shadow-[0_0_0_3px_rgba(224,136,80,0.15)]']"
          :style="thumbnailStyle(wp)"
          @click="select(wp.id)"
        >
            <span class="absolute inset-x-0 bottom-0 bg-black/30 px-1 py-0.5 text-center text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">{{ wp.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue';
import { wallpaperList } from './wallpapers.js';
import { wallpaperId, setWallpaper } from '../../stores/appearance.js';

const emit = defineEmits(['select']);
const visible = ref(false);
const current = computed(() => wallpaperId.value);
const wallpapers = wallpaperList;

function show() { visible.value = true; }
function close() { visible.value = false; }

function select(id) {
  setWallpaper(id);
  emit('select', id);
  close();
}

function thumbnailStyle(wp) {
  if (wp.type !== 'url') return {};
  return {
    backgroundImage: `${wp.effect?.overlay || 'none'}, url(${wp.url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };
}

defineExpose({ show });
</script>

<style scoped>
/* 毛玻璃 + 多层 shadow — 必须原生 */
.picker {
  background: rgba(255,255,255,0.78);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border: 1px solid rgba(255,255,255,0.5);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.wp-sea-mist-blue-bay {
  background: linear-gradient(to top, #fff1eb 0%, #ace0f9 100%);
}

.wp-morning-sandbar {
  background:
    radial-gradient(circle at 24% 20%, rgba(122,157,255,0.3) 0%, transparent 34%),
    radial-gradient(circle at 78% 72%, rgba(255,96,144,0.22) 0%, transparent 28%),
    linear-gradient(180deg, #293252 0%, #1f2640 56%, #101321 100%);
}

.wp-forest-mist {
  background:
    radial-gradient(ellipse at 50% 14%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.05) 30%, transparent 58%),
    linear-gradient(180deg, #e3ece5 0%, #adc1b0 56%, #75917c 100%);
}

.wp-silver-cyan-lake {
  background:
    radial-gradient(ellipse at 50% 14%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 32%, transparent 60%),
    linear-gradient(180deg, #e6eef2 0%, #b8cdd7 58%, #84a3b4 100%);
}

.wp-dusk-rock-shore {
  background:
    radial-gradient(ellipse at 50% 14%, rgba(214,222,242,0.18) 0%, rgba(214,222,242,0.04) 30%, transparent 60%),
    linear-gradient(180deg, #8f9cb0 0%, #687389 58%, #3c4456 100%);
}

.wp-linen-warm-paper {
  background:
    repeating-linear-gradient(0deg, rgba(110,96,78,0.035) 0px, rgba(110,96,78,0.035) 1px, transparent 1px, transparent 4px),
    repeating-linear-gradient(90deg, rgba(110,96,78,0.03) 0px, rgba(110,96,78,0.03) 1px, transparent 1px, transparent 4px),
    linear-gradient(180deg, #f1eadf 0%, #dfd0bb 58%, #d0bea8 100%);
}

.wp-amber-clouds {
  background:
    radial-gradient(ellipse at 34% 20%, rgba(255,242,230,0.28) 0%, rgba(255,242,230,0.06) 30%, transparent 58%),
    linear-gradient(180deg, #f3ddcf 0%, #e3b392 58%, #b77758 100%);
}

.wp-snowlight-peak {
  background:
    radial-gradient(ellipse at 50% 12%, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.1) 28%, transparent 56%),
    linear-gradient(180deg, #eef5fa 0%, #cfe0ec 58%, #8eb0c5 100%);
}
</style>
