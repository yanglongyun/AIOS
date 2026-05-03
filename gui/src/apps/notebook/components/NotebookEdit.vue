<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLauncher from '@/components/AppLauncher.vue';

const props = defineProps({
    noteId: { type: Number, default: null },
});
const router = useRouter();

const ACCESS_OPTIONS = [
    { value: 'full',    icon: 'visibility',         label: '完整同步', hint: 'AI 能读完整笔记' },
    { value: 'summary', icon: 'visibility_lock',    label: '仅摘要',   hint: 'AI 只能读标题和摘要' },
    { value: 'none',    icon: 'visibility_off',     label: '不同步',   hint: 'AI 完全读不到' },
];
const AI_KIND = {
    title:   { label: '标题', field: 'title',   verb: '生成标题', icon: 'auto_awesome' },
    summary: { label: '摘要', field: 'summary', verb: '生成摘要', icon: 'auto_awesome' },
    content: { label: '正文', field: 'content', verb: '润色',     icon: 'auto_fix' },
};

const draft = ref({
    id: null,
    title: '',
    summary: '',
    content: '',
    pinned: false,
    access: 'none',
});
const initialState = ref('');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const aiBusy = ref(null); // 'title' | 'summary' | 'content' | null
const aiResult = ref(null); // { kind, text, original } | null
const visOpen = ref(false);
const showDeleteConfirm = ref(false);

const isNew = computed(() => props.noteId === null);
const isDirty = computed(() => JSON.stringify(draft.value) !== initialState.value);
const accessMeta = computed(() => ACCESS_OPTIONS.find((o) => o.value === draft.value.access) || ACCESS_OPTIONS[0]);

const api = async (path, options = {}) => {
    const res = await fetch(`/apps/notebook${path}`, {
        ...options,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
    return data;
};

const snapshot = () => { initialState.value = JSON.stringify(draft.value); };

const fetchOne = async () => {
    if (isNew.value) { snapshot(); return; }
    loading.value = true;
    try {
        const data = await api('/list');
        const item = (data.items || []).find((x) => x.id === props.noteId);
        if (!item) throw new Error('笔记不存在');
        draft.value = {
            id: item.id,
            title: item.title || '',
            summary: item.summary || '',
            content: item.content || '',
            pinned: !!item.pinned,
            access: item.access || 'none',
        };
        snapshot();
    } catch (e) { error.value = e.message; }
    finally { loading.value = false; }
};

onMounted(fetchOne);

// ---- save / back ----
const buildPayload = () => ({
    title: draft.value.title,
    summary: draft.value.summary,
    content: draft.value.content,
    pinned: draft.value.pinned,
    access: draft.value.access,
});

const saveDraft = async () => {
    if (saving.value) return;
    saving.value = true;
    error.value = '';
    try {
        if (isNew.value) {
            const data = await api('/create', { method: 'POST', body: JSON.stringify(buildPayload()) });
            draft.value.id = data.item.id;
            snapshot();
            router.replace(`/app/notebook/${data.item.id}`);
        } else {
            await api('/update', { method: 'POST', body: JSON.stringify({ id: draft.value.id, ...buildPayload() }) });
            snapshot();
        }
    } catch (e) { error.value = e.message; }
    finally { saving.value = false; }
};

const backToList = async () => {
    if (isDirty.value && (draft.value.title.trim() || draft.value.summary.trim() || draft.value.content.trim())) {
        await saveDraft();
    }
    router.push('/app/notebook');
};

const removeNote = async () => {
    if (isNew.value) { router.push('/app/notebook'); return; }
    try {
        await api('/delete', { method: 'POST', body: JSON.stringify({ id: draft.value.id }) });
        router.push('/app/notebook');
    } catch (e) { error.value = e.message; }
};

const togglePin = () => {
    draft.value.pinned = !draft.value.pinned;
    if (!isNew.value) {
        api('/update', { method: 'POST', body: JSON.stringify({ id: draft.value.id, pinned: draft.value.pinned }) })
            .catch((e) => { error.value = e.message; });
    }
};

const setAccess = (a) => {
    draft.value.access = a;
    visOpen.value = false;
    if (!isNew.value) {
        api('/update', { method: 'POST', body: JSON.stringify({ id: draft.value.id, access: a }) })
            .catch((e) => { error.value = e.message; });
    }
};

// ---- AI ----
const runAI = async (kind) => {
    if (aiBusy.value) return;
    if (!draft.value.content.trim()) {
        error.value = '正文为空,无法' + (kind === 'content' ? '润色' : '生成');
        return;
    }
    aiBusy.value = kind;
    error.value = '';
    aiResult.value = null;
    try {
        let text = '';
        if (kind === 'title') {
            const data = await api('/ai/title', { method: 'POST', body: JSON.stringify({
                content: draft.value.content, summary: draft.value.summary,
            }) });
            text = data.title || '';
        } else if (kind === 'summary') {
            const data = await api('/ai/summary', { method: 'POST', body: JSON.stringify({
                content: draft.value.content,
            }) });
            text = data.summary || '';
        } else {
            const data = await api('/ai/polish', { method: 'POST', body: JSON.stringify({
                content: draft.value.content,
            }) });
            text = data.content || '';
        }
        if (!text) throw new Error('AI 没有返回结果');
        const meta = AI_KIND[kind];
        aiResult.value = {
            kind,
            text,
            original: draft.value[meta.field] || '',
        };
    } catch (e) { error.value = e.message; }
    finally { aiBusy.value = null; }
};

const applyAI = () => {
    if (!aiResult.value) return;
    const meta = AI_KIND[aiResult.value.kind];
    draft.value[meta.field] = aiResult.value.text;
    aiResult.value = null;
};
const discardAI = () => { aiResult.value = null; };

// keyboard
const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveDraft();
    }
    if (e.key === 'Escape') {
        if (aiResult.value) { discardAI(); return; }
        if (visOpen.value) { visOpen.value = false; return; }
    }
};
</script>

<template>
    <div class="flex h-full flex-col overflow-hidden" @keydown="onKeyDown" tabindex="-1">

        <!-- Top bar -->
        <header class="flex flex-none items-center gap-2 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <button class="header-icon" @click="backToList" title="返回">
                <span class="msi" style="font-size:20px">arrow_back</span>
            </button>

            <div class="ml-2 flex items-center gap-2 text-[12px] text-faint">
                <span v-if="saving">保存中...</span>
                <span v-else-if="!isNew && !isDirty">已保存</span>
                <span v-else-if="isDirty && draft.id">未保存的修改</span>
                <span v-else-if="isNew">新笔记</span>
            </div>

            <div class="ml-auto flex items-center gap-1">
                <!-- visibility -->
                <div class="relative">
                    <button class="header-icon" :class="{ 'is-on': draft.access !== 'none' }"
                            @click="visOpen = !visOpen" :title="`同步给 AI · ${accessMeta.label}`">
                        <span class="msi" style="font-size:18px">{{ accessMeta.icon }}</span>
                    </button>
                    <div v-if="visOpen" class="vis-popover" @click.stop>
                        <div class="vis-h">同步给 AI</div>
                        <button v-for="opt in ACCESS_OPTIONS" :key="opt.value"
                                class="vis-row"
                                :class="{ 'is-on': draft.access === opt.value }"
                                @click="setAccess(opt.value)">
                            <span class="msi" style="font-size:18px">{{ opt.icon }}</span>
                            <div class="flex flex-col text-left">
                                <span class="text-[13px] font-semibold">{{ opt.label }}</span>
                                <span class="text-[11.5px] text-muted">{{ opt.hint }}</span>
                            </div>
                            <span v-if="draft.access === opt.value" class="msi ml-auto" style="font-size:16px;color:var(--color-accent-hi)">check</span>
                        </button>
                    </div>
                </div>

                <!-- pin -->
                <button class="header-icon" :class="{ 'is-on': draft.pinned }" @click="togglePin" :title="draft.pinned ? '取消置顶' : '置顶'">
                    <span class="msi" :style="draft.pinned ? `font-size:18px;font-variation-settings:'FILL' 1` : 'font-size:18px'">push_pin</span>
                </button>

                <!-- delete -->
                <button v-if="!isNew" class="header-icon hover-bad" @click="showDeleteConfirm = true" title="删除">
                    <span class="msi" style="font-size:18px">delete_outline</span>
                </button>

                <AppLauncher class="ml-2 flex-none" />
            </div>
        </header>

        <div v-if="error" class="mx-8 my-2 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-4"
             style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
            {{ error }}
        </div>

        <!-- Body -->
        <div class="min-h-0 flex-1 overflow-auto pb-32">
            <div class="mx-auto max-w-[680px] px-10 pt-4 max-md:px-4">

                <!-- Title -->
                <input v-model="draft.title"
                       class="field-title"
                       placeholder="标题" />

                <!-- Summary -->
                <input v-model="draft.summary"
                       class="field-summary"
                       placeholder="摘要(可选,一句话概括)" />

                <div class="thin-divider"></div>

                <!-- Body -->
                <textarea v-model="draft.content"
                          class="field-body"
                          placeholder="写点什么..."
                          rows="14"></textarea>

                <!-- Foot -->
                <div class="foot-row">
                    <div class="text-[11.5px] text-faint">
                        {{ draft.content.length }} 字 ·
                        <span v-if="draft.access === 'full'">AI 可读完整笔记</span>
                        <span v-else-if="draft.access === 'summary'">AI 仅可读标题和摘要</span>
                        <span v-else>AI 不可读这条笔记</span>
                    </div>
                    <button class="save-btn ml-auto" :disabled="saving || !isDirty" @click="saveDraft">
                        {{ isDirty ? '保存' : '已保存' }}
                    </button>
                </div>

            </div>
        </div>

        <!-- Bottom AI dock —— 结果面板在工具条上方 -->
        <div class="ai-dock-wrap flex-none">
            <transition name="result-fade">
                <div v-if="aiResult" class="ai-result" @click.stop>
                    <div class="ai-result-head">
                        <span class="msi" style="font-size:15px;color:var(--color-accent-hi)">{{ AI_KIND[aiResult.kind].icon }}</span>
                        <span class="text-[12.5px] font-semibold text-ink">AI {{ AI_KIND[aiResult.kind].verb }}</span>
                        <span class="text-[11.5px] text-faint">将替换当前的{{ AI_KIND[aiResult.kind].label }}</span>
                        <button class="ml-auto header-icon" @click="discardAI" title="关闭">
                            <span class="msi" style="font-size:16px">close</span>
                        </button>
                    </div>
                    <div class="ai-result-body">{{ aiResult.text }}</div>
                    <div class="ai-result-foot">
                        <button class="btn-ghost" @click="discardAI">放弃</button>
                        <button class="btn-primary" @click="applyAI">应用</button>
                    </div>
                </div>
            </transition>

            <div class="ai-toolbar">
                <button class="ai-btn" :disabled="!!aiBusy" @click="runAI('title')">
                    <span v-if="aiBusy === 'title'" class="msi spin" style="font-size:15px">progress_activity</span>
                    <span v-else class="msi" style="font-size:15px">auto_awesome</span>
                    <span>生成标题</span>
                </button>
                <button class="ai-btn" :disabled="!!aiBusy" @click="runAI('summary')">
                    <span v-if="aiBusy === 'summary'" class="msi spin" style="font-size:15px">progress_activity</span>
                    <span v-else class="msi" style="font-size:15px">auto_awesome</span>
                    <span>生成摘要</span>
                </button>
                <button class="ai-btn" :disabled="!!aiBusy" @click="runAI('content')">
                    <span v-if="aiBusy === 'content'" class="msi spin" style="font-size:15px">progress_activity</span>
                    <span v-else class="msi" style="font-size:15px">auto_fix</span>
                    <span>润色</span>
                </button>
            </div>
        </div>

        <!-- Delete confirm -->
        <div v-if="showDeleteConfirm" class="confirm-mask" @click.self="showDeleteConfirm = false">
            <div class="confirm-card">
                <div class="text-[15px] font-semibold text-ink mb-1">删除这条笔记?</div>
                <div class="text-[13px] text-muted mb-4">删除后不可恢复。</div>
                <div class="flex justify-end gap-2">
                    <button class="btn-ghost" @click="showDeleteConfirm = false">取消</button>
                    <button class="btn-danger" @click="removeNote">删除</button>
                </div>
            </div>
        </div>

    </div>
</template>

<style scoped>
.header-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: transparent;
    color: var(--color-ink);
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer;
    transition: background .12s, color .12s;
}
.header-icon:hover { background: var(--color-bg-hi); }
.header-icon.is-on { background: var(--color-accent-bg); color: var(--color-accent-hi); }
.hover-bad:hover { color: var(--color-bad) !important; background: color-mix(in srgb, var(--color-bad) 10%, transparent); }

/* === Visibility popover === */
.vis-popover {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    width: 240px;
    background: #fff;
    border: 1px solid var(--color-line);
    border-radius: 12px;
    padding: 6px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06);
    z-index: 20;
}
.vis-h {
    padding: 8px 10px 4px;
    color: var(--color-faint);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.vis-row {
    display: flex; align-items: center; gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border-radius: 8px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-ink);
    text-align: left;
    transition: background .12s;
}
.vis-row:hover { background: var(--color-bg-hi); }
.vis-row.is-on { background: var(--color-accent-bg); }
.vis-row.is-on .msi:first-child { color: var(--color-accent-hi); }

/* === Editor fields === */
.field-title, .field-summary {
    display: block;
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-ink);
    padding: 6px 0;
    font-family: inherit;
}
.field-title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.25;
}
.field-title::placeholder { color: var(--color-faint); font-weight: 600; }
.field-summary {
    font-size: 14px;
    color: var(--color-muted);
    font-style: italic;
    padding: 4px 0 6px;
}
.field-summary::placeholder { color: var(--color-faint); font-style: italic; }

.thin-divider {
    height: 1px;
    background: var(--color-line);
    margin: 10px 0 14px;
}

.field-body {
    width: 100%;
    border: none;
    outline: none;
    resize: vertical;
    background: transparent;
    color: var(--color-ink);
    font-family: inherit;
    font-size: 15px;
    line-height: 1.65;
    padding: 4px 0 8px;
    min-height: 220px;
}
.field-body::placeholder { color: var(--color-faint); }

.foot-row {
    display: flex;
    align-items: center;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid var(--color-line);
}

.save-btn {
    padding: 7px 18px;
    border-radius: 10px;
    background: var(--color-bg-hi);
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background .12s;
}
.save-btn:hover:not(:disabled) { background: var(--color-card-sub); }
.save-btn:disabled { opacity: 0.45; cursor: default; }

/* === Bottom AI dock === */
.ai-dock-wrap {
    position: relative;
    padding: 0 24px 18px;
    pointer-events: none;
    max-md\:padding-x-3: 12px;
}
.ai-dock-wrap > * { pointer-events: auto; }

.ai-toolbar {
    margin: 0 auto;
    max-width: 460px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--color-line);
    border-radius: 999px;
    padding: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
}
.ai-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 8px 14px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background .12s, color .12s, opacity .12s;
}
.ai-btn:hover:not(:disabled) { background: var(--color-bg-hi); color: var(--color-accent-hi); }
.ai-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.ai-result {
    margin: 0 auto 10px;
    max-width: 600px;
    background: #fff;
    border: 1px solid var(--color-line);
    border-radius: 14px;
    box-shadow: 0 8px 22px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04);
    overflow: hidden;
}
.ai-result-head {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px 8px 14px;
    border-bottom: 1px solid var(--color-line);
}
.ai-result-body {
    padding: 12px 16px;
    font-size: 14px;
    color: var(--color-ink);
    line-height: 1.6;
    white-space: pre-wrap;
    max-height: 240px;
    overflow-y: auto;
    background: var(--color-card-sub);
}
.ai-result-foot {
    display: flex; align-items: center; justify-content: flex-end;
    gap: 8px;
    padding: 10px 12px;
}

.btn-ghost {
    padding: 7px 16px;
    border-radius: 9px;
    background: var(--color-bg-hi);
    color: var(--color-ink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: background .12s;
}
.btn-ghost:hover { background: var(--color-card-sub); }
.btn-primary {
    padding: 7px 18px;
    border-radius: 9px;
    background: var(--color-accent);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    box-shadow: 0 1px 2px color-mix(in srgb, var(--color-accent) 30%, transparent);
    transition: background .12s, box-shadow .12s;
}
.btn-primary:hover {
    background: var(--color-accent-hi);
    box-shadow: 0 2px 6px color-mix(in srgb, var(--color-accent) 40%, transparent);
}
.btn-danger {
    padding: 7px 14px;
    border-radius: 8px;
    background: var(--color-bad);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
}
.btn-danger:hover { background: #991414; }

/* === Result transitions === */
.result-fade-enter-active, .result-fade-leave-active {
    transition: opacity .18s, transform .18s;
}
.result-fade-enter-from, .result-fade-leave-to {
    opacity: 0;
    transform: translateY(8px);
}

/* === Confirm modal === */
.confirm-mask {
    position: fixed; inset: 0;
    background: rgba(20, 20, 20, 0.20);
    display: flex; align-items: center; justify-content: center;
    z-index: 50;
}
.confirm-card {
    width: 320px;
    background: #fff;
    border-radius: 14px;
    padding: 18px 20px;
    box-shadow: 0 12px 36px rgba(0,0,0,0.16);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
