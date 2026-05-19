<script setup>
import { nextTick, ref } from 'vue';
import { relTime } from './utils.js';

const props = defineProps({
    note: { type: Object, required: true },
    dirty: { type: Boolean, default: false }
});

const titleEl = ref(null);
const bodyEl = ref(null);

defineExpose({
    focusTitle: () => titleEl.value?.focus(),
    focusBody: () => bodyEl.value?.focus(),
    autoFocus: () => {
        nextTick(() => {
            if (!props.note.title && !props.note.body) titleEl.value?.focus();
            else bodyEl.value?.focus();
        });
    }
});
</script>

<template>
    <div class="flex flex-1 min-h-0 justify-center overflow-y-auto px-8 pb-15 pt-6 max-md:px-4 max-md:pb-10 max-md:pt-3">
        <div class="flex w-full max-w-[760px] flex-col gap-4">
            <input
                ref="titleEl"
                v-model="note.title"
                placeholder="标题"
                class="w-full resize-none border-0 bg-transparent py-1.5 font-inherit text-[28px] font-bold tracking-[-0.01em] text-ink outline-none placeholder:font-semibold placeholder:text-faint max-md:text-[22px]" />
            <textarea
                ref="bodyEl"
                v-model="note.body"
                placeholder="开始写…"
                class="w-full flex-1 resize-none border-0 bg-transparent text-[16px] leading-[1.7] text-ink outline-none placeholder:text-faint max-md:text-[15px]"
                style="min-height: 60vh"></textarea>
            <div class="flex gap-1.5 border-t border-line-soft pt-1 text-[11.5px] text-faint">
                <span v-if="note.created_at">{{ relTime(note.updated_at || note.created_at) }}</span>
                <span v-else>新建笔记</span>
                <span v-if="dirty" class="text-warn">· 未保存</span>
                <span v-else-if="note.id" class="text-good opacity-70">· 已保存</span>
            </div>
        </div>
    </div>
</template>
