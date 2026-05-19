<script setup>
defineProps({
    tabs: { type: Array, default: () => [] },
    activeId: { type: String, default: '' }
});

defineEmits(['add', 'pick', 'close']);

function shortCwd(p) {
    return (p || '').replace(/^\/Users\/[^/]+/, '~').replace(/^\/home\/[^/]+/, '~');
}
</script>

<template>
    <div class="flex h-full flex-col">
        <div class="flex items-center gap-2 p-3">
            <button
                class="inline-flex cursor-pointer items-center gap-2 rounded-[20px] border border-line bg-white px-4 py-[9px] text-[13px] font-medium text-ink shadow-[0_1px_2px_rgba(60,64,67,0.08)] transition-[background,box-shadow] hover:bg-[#fafbfc] hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_10px_rgba(60,64,67,0.06)]"
                @click="$emit('add')">
                <span class="msi sm text-accent">add</span>
                <span>新会话</span>
            </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-1">
            <div v-if="!tabs.length" class="px-4 py-5 text-center text-[12.5px] text-faint">
                点 + 新建一个 PTY 会话
            </div>
            <div v-for="t in tabs" :key="t.id"
                 class="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-bg-hi"
                 :class="{ 'bg-blue-bg': t.id === activeId }"
                 @click="$emit('pick', t.id)">
                <span class="msi sm flex-none"
                      :class="t.id === activeId ? 'text-blue-fg' : 'text-muted'">terminal</span>
                <div class="min-w-0 flex-1">
                    <div class="truncate text-[13.5px] font-medium text-ink">
                        {{ t.title || ('会话 ' + String(t.id).slice(0, 6)) }}
                    </div>
                    <div class="truncate font-mono text-[11.5px] text-faint">
                        {{ shortCwd(t.cwd) }}
                    </div>
                </div>
                <button
                    class="grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-0 bg-transparent text-faint opacity-0 transition-[background,opacity] hover:bg-black/10 hover:text-ink group-hover:opacity-100"
                    :class="{ 'opacity-100': t.id === activeId }"
                    title="关闭"
                    @click="$emit('close', t.id, $event)">
                    <span class="msi xxs">close</span>
                </button>
            </div>
        </div>
    </div>
</template>
