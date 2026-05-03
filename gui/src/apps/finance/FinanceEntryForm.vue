<script setup>
import { ref } from 'vue';

const props = defineProps({
    form:     { type: Object,  required: true },
    todayStr: { type: String,  required: true },
    saving:   { type: Boolean, default: false }
});

defineEmits(['save']);

const quickText = ref('');
const aiBusy = ref(false);
const aiError = ref('');
const composing = ref(false);

const analyze = async () => {
    const text = quickText.value.trim();
    if (!text || aiBusy.value) return;
    aiBusy.value = true;
    aiError.value = '';
    try {
        const res = await fetch('/apps/finance/ai/parse', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
        props.form.newType = data.type || 'expense';
        props.form.newDate = data.date || '';
        props.form.newNote = data.note || '';
        props.form.newAmount = data.amount != null ? String(data.amount) : '';
        quickText.value = '';
    } catch (e) {
        aiError.value = e.message || '分析失败';
    } finally {
        aiBusy.value = false;
    }
};

const onQuickKey = (e) => {
    if (composing.value || e.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); }
};
</script>

<template>
    <section class="mb-4 rounded-2xl bg-card px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] max-md:px-3">

        <!-- AI 快速录入 -->
        <div class="ai-quick mb-3 flex items-center gap-2">
            <input v-model="quickText"
                @keydown="onQuickKey"
                @compositionstart="composing = true"
                @compositionend="composing = false"
                type="text"
                placeholder="一句话记账，例如：中午三明治 25"
                class="ai-quick-input min-w-0 flex-1 h-9 rounded-xl border-0 bg-bg-hi px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent/40" />
            <button class="ai-analyze inline-flex h-9 items-center gap-1.5 rounded-xl border-0 px-4 text-[12.5px] font-semibold text-white cursor-pointer disabled:cursor-default disabled:opacity-45"
                :disabled="aiBusy || !quickText.trim()"
                @click="analyze">
                <span v-if="aiBusy" class="msi spin" style="font-size:15px">progress_activity</span>
                <span v-else class="msi" style="font-size:15px">auto_awesome</span>
                <span>{{ aiBusy ? '分析中…' : '分析' }}</span>
            </button>
        </div>
        <div v-if="aiError" class="mb-3 rounded-[10px] px-3 py-1.5 text-[12px] text-bad"
             style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
            {{ aiError }}
        </div>

        <!-- Type tabs -->
        <div class="mb-2 flex items-center justify-center">
            <div class="inline-flex items-center rounded-full bg-bg-hi p-0.5 text-[12px] font-semibold">
                <button class="type-tab cursor-pointer rounded-full border-0 px-3 py-1 transition-all"
                    :class="form.newType === 'expense' ? 'is-active text-bad' : 'bg-transparent text-muted hover:text-ink'"
                    @click="form.newType = 'expense'">
                    __T_FINANCE_EXPENSE__
                </button>
                <button class="type-tab cursor-pointer rounded-full border-0 px-3 py-1 transition-all"
                    :class="form.newType === 'income' ? 'is-active text-blue-fg' : 'bg-transparent text-muted hover:text-ink'"
                    @click="form.newType = 'income'">
                    __T_FINANCE_INCOME__
                </button>
            </div>
        </div>

        <div class="grid grid-cols-[110px_minmax(160px,1fr)_140px_auto] gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
            <label class="block">
                <span class="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">__T_FINANCE_DATE__</span>
                <input v-model="form.newDate" type="text"
                    class="entry-input h-9 w-full rounded-xl border-0 bg-bg-hi px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent/40"
                    :placeholder="todayStr" />
            </label>
            <label class="block">
                <span class="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">__T_FINANCE_NOTE__</span>
                <input v-model="form.newNote" type="text"
                    class="entry-input h-9 w-full rounded-xl border-0 bg-bg-hi px-3 text-[13px] text-ink outline-none focus:ring-2 focus:ring-accent/40"
                    placeholder="__T_FINANCE_NOTE_PLACEHOLDER__"
                    @keyup.enter="$emit('save')" />
            </label>
            <label class="block">
                <span class="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-faint">__T_FINANCE_AMOUNT__</span>
                <input v-model="form.newAmount" type="text"
                    class="entry-input h-9 w-full rounded-xl border-0 bg-bg-hi px-3 text-right font-mono text-[13px] outline-none focus:ring-2 focus:ring-accent/40"
                    :class="form.newType === 'income' ? 'text-blue-fg' : 'text-bad'"
                    placeholder="0.00"
                    @keyup.enter="$emit('save')" />
            </label>
            <button class="save-btn mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 px-4 text-[12.5px] font-semibold text-white transition-shadow disabled:cursor-default disabled:opacity-45 max-lg:mt-0 max-lg:self-end"
                :disabled="saving || !form.newAmount"
                @click="$emit('save')">
                <span class="msi" style="font-size:16px">check</span>
                <span>{{ saving ? '__T_FINANCE_SAVING__' : '__T_COMMON_SAVE__' }}</span>
            </button>
        </div>
    </section>
</template>

<style scoped>
.entry-input::placeholder, .ai-quick-input::placeholder { color: var(--color-faint); }

.type-tab.is-active {
    background: var(--color-card);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.ai-analyze {
    background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hi) 100%);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--color-accent) 30%, transparent);
    transition: box-shadow .15s, opacity .12s;
}
.ai-analyze:hover:not(:disabled) {
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-accent) 40%, transparent);
}

.save-btn {
    background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hi) 100%);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}
.save-btn:hover:not(:disabled) {
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
