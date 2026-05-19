<script setup>
import { computed } from 'vue';
import { useFilesStore } from '@/stores/files';
import { useFileStars } from '@/composables/useFileStars.js';

const files = useFilesStore();
const { stars, removeStar } = useFileStars();

defineEmits(['pick']);

const sep = computed(() => files.pathSep || '/');
const home = computed(() => files.homePath || '');

const shortcuts = computed(() => {
    if (!home.value) return [];
    const j = (sub) => home.value + sep.value + sub;
    return [
        { name: '主目录', path: home.value, icon: 'home' },
        { name: '桌面', path: j('Desktop'), icon: 'desktop_mac' },
        { name: '下载', path: j('Downloads'), icon: 'download' },
        { name: '文档', path: j('Documents'), icon: 'description' },
        { name: '图片', path: j('Pictures'), icon: 'image' }
    ];
});

function basename(p) {
    if (!p) return '';
    const parts = p.split(sep.value).filter(Boolean);
    return parts[parts.length - 1] || p;
}
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- 星标 -->
        <section class="p-3">
            <div class="mx-2 mb-2 flex h-[22px] items-center">
                <span class="flex-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">星标</span>
            </div>
            <div class="flex flex-col gap-px">
                <div v-if="!stars.length" class="px-3 pb-2 pt-1 text-[11.5px] text-faint">暂无星标</div>
                <div v-for="p in stars" :key="p"
                     class="group flex items-center rounded-full text-[13.5px] text-ink transition-colors hover:bg-bg-hi"
                     :class="{ 'bg-blue-bg text-blue-fg': files.cwd === p }">
                    <button class="flex flex-1 min-w-0 cursor-pointer items-center gap-3 rounded-full border-0 bg-transparent px-3 py-2.5 text-inherit"
                            @click="$emit('pick', p)">
                        <span class="msi sm flex-none text-warn">star</span>
                        <span class="flex-1 truncate text-left" :title="p">{{ basename(p) }}</span>
                    </button>
                    <button type="button"
                            class="mr-2 grid h-6 w-6 flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint opacity-0 transition-[opacity,background,color] hover:bg-black/10 hover:text-ink group-hover:opacity-100"
                            title="取消收藏"
                            @click.stop="removeStar(p)">
                        <span class="msi xxs">close</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- 快捷 -->
        <section class="px-3 pb-3 pt-1">
            <div class="mx-2 mb-2 flex h-[22px] items-center">
                <span class="flex-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">快捷</span>
            </div>
            <div class="flex flex-col gap-px">
                <button v-for="s in shortcuts" :key="s.path"
                        class="flex cursor-pointer items-center gap-3 rounded-full border-0 bg-transparent px-3 py-2.5 text-[13.5px] text-ink transition-colors hover:bg-bg-hi"
                        :class="{ 'bg-blue-bg text-blue-fg': files.cwd === s.path }"
                        @click="$emit('pick', s.path)">
                    <span class="msi sm flex-none"
                          :class="files.cwd === s.path ? 'text-blue-fg' : 'text-muted'">{{ s.icon }}</span>
                    <span class="flex-1 truncate text-left">{{ s.name }}</span>
                </button>
            </div>
        </section>
    </div>
</template>
