<script setup>
import { ref, onMounted } from 'vue';

const draft = ref('');
const loading = ref(true);
const saving = ref(false);
const error = ref('');
const notice = ref('');

onMounted(async () => {
    try {
        const res = await fetch('/api/settings/prompt');
        const data = await res.json();
        if (data.success) {
            draft.value = data.content || '';
        } else {
            error.value = data.message || '加载失败';
        }
    } catch (e) {
        error.value = e.message;
    } finally {
        loading.value = false;
    }
});

const save = async () => {
    saving.value = true;
    error.value = '';
    notice.value = '';
    try {
        const res = await fetch('/api/settings/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: draft.value })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || '保存失败');
        notice.value = '指令已保存';
    } catch (e) {
        error.value = e.message;
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <div class="flex h-full flex-col bg-bg">
        <header class="flex flex-none items-end justify-between gap-4 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">
                指令
            </h1>
            <button
                class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-bg px-3 text-[12.5px] font-semibold text-blue-fg transition-colors hover:bg-line-hi disabled:opacity-50"
                :disabled="saving || loading"
                @click="save">
                <span class="msi sm">save</span>
                <span>{{ saving ? '保存中…' : '保存' }}</span>
            </button>
        </header>

        <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 max-md:px-4 max-md:pb-10">
            <div v-if="loading" class="flex flex-col items-center gap-2 py-15 text-muted">
                <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
                <div class="text-[14px]">加载中…</div>
            </div>
            <div v-else-if="error" class="rounded-[10px] px-3.5 py-2 text-[13px] text-bad"
                 style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
                {{ error }}
            </div>
            <div v-else class="flex min-h-[520px] flex-col gap-3">
                <div v-if="notice" class="rounded-[10px] px-3.5 py-2 text-[13px] text-good"
                    style="background:color-mix(in srgb, var(--color-good) 12%, transparent)">
                    {{ notice }}
                </div>
                <textarea
                    v-model="draft"
                    class="min-h-[520px] resize-y rounded-xl border border-line bg-bg-elev px-4 py-3 font-mono text-[13px] leading-[1.65] text-ink outline-none focus:border-accent"
                    spellcheck="false" />
            </div>
        </div>
    </div>
</template>
