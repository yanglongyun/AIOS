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
            :style="wp.type === 'url' ? { backgroundImage: `url(${wp.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
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
import { ref } from 'vue';
import { wallpaperList } from './wallpapers.js';

const emit = defineEmits(['select']);
const visible = ref(false);
const current = ref(localStorage.getItem('aios-wallpaper') || 'wp-warm-morning');
const wallpapers = wallpaperList;

function show() { visible.value = true; }
function close() { visible.value = false; }

function select(id) {
  current.value = id;
  emit('select', id);
  close();
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

/* 渐变缩略图 */
.wp-warm-morning  { background: linear-gradient(135deg, #fdf5e6, #d4a574); }
.wp-soft-lavender { background: linear-gradient(135deg, #f0e6f6, #b8a0d8); }
.wp-ocean-breeze  { background: linear-gradient(135deg, #e6f2f8, #78b0c8); }
.wp-forest-mist   { background: linear-gradient(135deg, #e8f0e6, #88b880); }
.wp-sunset-glow   { background: linear-gradient(135deg, #fef0e6, #e89870); }

/* 纹理缩略图 */
.wp-wood {
  background-color: #b8884c;
  background-image:
    repeating-linear-gradient(82deg, rgba(0,0,0,0) 0, rgba(0,0,0,0.04) 1px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px),
    linear-gradient(180deg, #c89858, #a87838);
}
.wp-linen {
  background-color: #e4d8c8;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px),
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 3px);
}
.wp-dark-stone {
  background-color: #2a2a2e;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(60,58,65,0.6) 0%, transparent 50%),
    radial-gradient(ellipse at 75% 25%, rgba(55,50,58,0.5) 0%, transparent 45%);
}
</style>
