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
  background-color: #000408;
  background-image:
    radial-gradient(circle 2.5px at 8% 14%, rgba(255,248,220,0.96) 0%, transparent 100%),
    radial-gradient(circle 2.2px at 52% 4%, rgba(255,255,255,0.92) 0%, transparent 100%),
    radial-gradient(circle 2px at 84% 9%, rgba(200,220,255,0.90) 0%, transparent 100%),
    radial-gradient(circle 2.3px at 91% 42%, rgba(255,255,255,0.93) 0%, transparent 100%),
    radial-gradient(circle 2px at 22% 52%, rgba(255,235,180,0.88) 0%, transparent 100%),
    radial-gradient(circle 1.6px at 15% 28%, rgba(255,255,255,0.80) 0%, transparent 100%),
    radial-gradient(circle 1.7px at 72% 22%, rgba(255,255,255,0.82) 0%, transparent 100%),
    radial-gradient(circle 1.5px at 45% 35%, rgba(255,240,200,0.76) 0%, transparent 100%),
    radial-gradient(circle 1.6px at 62% 48%, rgba(255,255,255,0.78) 0%, transparent 100%),
    radial-gradient(circle 1.4px at 78% 58%, rgba(180,200,255,0.74) 0%, transparent 100%),
    radial-gradient(circle 1.5px at 30% 65%, rgba(255,255,255,0.76) 0%, transparent 100%),
    radial-gradient(circle 1px at 48% 55%, rgba(255,255,255,0.68) 0%, transparent 100%),
    radial-gradient(circle 1.1px at 12% 82%, rgba(255,255,255,0.58) 0%, transparent 100%),
    radial-gradient(ellipse 88% 22% at 52% 50%, rgba(158,178,242,0.20) 0%, rgba(128,152,232,0.10) 45%, transparent 68%),
    radial-gradient(ellipse 22% 16% at 35% 38%, rgba(78,128,242,0.18) 0%, transparent 62%),
    radial-gradient(ellipse 18% 12% at 68% 55%, rgba(222,148,88,0.12) 0%, transparent 58%),
    radial-gradient(ellipse 15% 10% at 82% 35%, rgba(58,198,192,0.10) 0%, transparent 58%),
    radial-gradient(ellipse 100% 30% at 50% 100%, rgba(14,24,72,0.68) 0%, transparent 50%),
    linear-gradient(180deg, #000205 0%, #010408 30%, #020610 60%, #010508 88%, #000204 100%);
}

.wp-forest-mist {
  background-color: #020c14;
  background-image:
    radial-gradient(ellipse 20% 80% at 28% 42%, rgba(28,218,128,0.62) 0%, rgba(20,200,112,0.22) 52%, transparent 80%),
    radial-gradient(ellipse 15% 72% at 42% 38%, rgba(18,208,175,0.52) 0%, rgba(12,188,162,0.18) 52%, transparent 78%),
    radial-gradient(ellipse 17% 75% at 57% 35%, rgba(38,178,222,0.48) 0%, rgba(28,158,210,0.16) 52%, transparent 80%),
    radial-gradient(ellipse 13% 68% at 70% 40%, rgba(128,55,235,0.45) 0%, rgba(108,38,215,0.15) 52%, transparent 78%),
    radial-gradient(ellipse 10% 58% at 83% 45%, rgba(225,55,188,0.32) 0%, transparent 74%),
    radial-gradient(ellipse 150% 52% at 50% 42%, rgba(12,78,78,0.38) 0%, transparent 64%),
    radial-gradient(ellipse 100% 22% at 50% 100%, rgba(8,58,45,0.58) 0%, transparent 52%),
    linear-gradient(180deg, #010608 0%, #020b14 28%, #030e1c 58%, #020c16 82%, #010609 100%);
}

.wp-silver-cyan-lake {
  background-color: #c07085;
  background-image:
    radial-gradient(ellipse 75% 38% at 50% 105%, rgba(255,185,100,0.72) 0%, rgba(255,140,90,0.38) 38%, transparent 60%),
    radial-gradient(ellipse 100% 28% at 50% 88%, rgba(255,138,118,0.48) 0%, rgba(242,108,128,0.22) 48%, transparent 65%),
    radial-gradient(ellipse 38% 18% at 18% 68%, rgba(255,175,190,0.38) 0%, transparent 58%),
    radial-gradient(ellipse 32% 15% at 82% 65%, rgba(255,168,185,0.32) 0%, transparent 55%),
    radial-gradient(ellipse 85% 52% at 50% 0%, rgba(72,32,118,0.52) 0%, rgba(55,24,95,0.24) 52%, transparent 78%),
    linear-gradient(180deg, #221038 0%, #581840 22%, #a84868 42%, #d87868 62%, #f0a870 80%, #ffd898 100%);
}

.wp-dusk-rock-shore {
  background-color: #505d6e;
  background-image:
    repeating-linear-gradient(
      38deg,
      transparent 0px, transparent 5px,
      rgba(255,255,255,0.055) 5px, rgba(255,255,255,0.055) 6px
    ),
    repeating-linear-gradient(
      -38deg,
      transparent 0px, transparent 5px,
      rgba(0,0,0,0.08) 5px, rgba(0,0,0,0.08) 6px
    ),
    repeating-linear-gradient(
      180deg,
      transparent 0px, transparent 20px,
      rgba(0,0,0,0.045) 20px, rgba(0,0,0,0.045) 21px,
      transparent 21px, transparent 42px,
      rgba(255,255,255,0.03) 42px, rgba(255,255,255,0.03) 43px
    ),
    radial-gradient(ellipse at 50% 8%, rgba(198,212,235,0.24) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(18,22,32,0.45) 0%, transparent 50%),
    linear-gradient(180deg, #8c99ac 0%, #637282 40%, #4a5668 72%, #2c3440 100%);
}

.wp-linen-warm-paper {
  background-color: #d5c8ac;
  background-image:
    repeating-linear-gradient(
      90deg,
      rgba(75,55,30,0.09) 0px, rgba(75,55,30,0.09) 1px,
      transparent 1px, transparent 2px,
      rgba(75,55,30,0.055) 2px, rgba(75,55,30,0.055) 3px,
      transparent 3px, transparent 5px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(75,55,30,0.08) 0px, rgba(75,55,30,0.08) 1px,
      transparent 1px, transparent 2px,
      rgba(75,55,30,0.045) 2px, rgba(75,55,30,0.045) 3px,
      transparent 3px, transparent 5px
    ),
    repeating-linear-gradient(
      45deg,
      rgba(255,242,215,0.07) 0px, rgba(255,242,215,0.07) 1px,
      transparent 1px, transparent 5px
    ),
    radial-gradient(ellipse at 50% 15%, rgba(255,250,238,0.32) 0%, transparent 55%),
    linear-gradient(165deg, #f6ede0 0%, #e2d1bc 48%, #cdbfa5 100%);
}

.wp-amber-clouds {
  background-color: #f0c8e0;
  background-image:
    radial-gradient(circle 1.8px at 15px 15px, rgba(255,130,190,0.32) 0%, transparent 100%),
    radial-gradient(circle 1.4px at 30px 30px, rgba(175,135,255,0.26) 0%, transparent 100%),
    radial-gradient(ellipse 55% 42% at 20% 22%, rgba(255,228,242,0.70) 0%, rgba(255,198,230,0.28) 44%, transparent 68%),
    radial-gradient(ellipse 48% 38% at 84% 80%, rgba(215,185,255,0.55) 0%, rgba(195,158,250,0.20) 44%, transparent 65%),
    radial-gradient(ellipse 42% 32% at 55% 52%, rgba(180,248,228,0.28) 0%, transparent 55%),
    linear-gradient(135deg, #ffd8ec 0%, #f5c5e8 22%, #e8bef5 46%, #d2cbff 68%, #bef0ea 100%);
  background-size: 30px 30px, 30px 30px, 100% 100%, 100% 100%, 100% 100%, 100% 100%;
}

.wp-snowlight-peak {
  background-color: #000810;
  background-image:
    repeating-linear-gradient(65deg, transparent 0px, transparent 9px, rgba(0,210,200,0.055) 9px, rgba(0,210,200,0.055) 10px),
    repeating-linear-gradient(-25deg, transparent 0px, transparent 12px, rgba(0,190,220,0.045) 12px, rgba(0,190,220,0.045) 13px),
    radial-gradient(ellipse 28% 20% at 38% 48%, rgba(0,228,195,0.30) 0%, rgba(0,205,178,0.12) 45%, transparent 72%),
    radial-gradient(ellipse 20% 14% at 70% 60%, rgba(0,205,232,0.24) 0%, rgba(0,182,215,0.08) 45%, transparent 68%),
    radial-gradient(circle 70px at 55% 35%, rgba(0,245,210,0.20) 0%, rgba(0,215,185,0.06) 45%, transparent 62%),
    radial-gradient(ellipse 15% 10% at 22% 65%, rgba(30,100,200,0.18) 0%, transparent 62%),
    radial-gradient(ellipse 100% 45% at 50% 100%, rgba(0,35,75,0.65) 0%, transparent 55%),
    linear-gradient(180deg, #000305 0%, #000810 32%, #000c18 62%, #000a14 86%, #000508 100%);
}
</style>
