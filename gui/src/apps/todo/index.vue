<script setup>
import { ref, onMounted, nextTick } from 'vue';

const todos    = ref([]);
const loading  = ref(false);
const error    = ref('');
const newTitle = ref('');
const inputRef = ref(null);

const request = async (path, options = {}) => {
    const res = await fetch(`/apps/todo${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
    return data;
};

const fetchAll = async () => {
    loading.value = true;
    error.value = '';
    try {
        const data = await request('/list');
        todos.value = data.items || [];
    } catch (e) { error.value = e.message; }
    finally { loading.value = false; }
};

const addTodo = async () => {
    const title = newTitle.value.trim();
    if (!title) return;
    try {
        const data = await request('/create', { method: 'POST', body: JSON.stringify({ title }) });
        todos.value.unshift(data.item);
        newTitle.value = '';
        await nextTick();
        inputRef.value?.focus();
    } catch (e) { error.value = e.message; }
};

const sortLocal = () => {
    todos.value = [...todos.value].sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned;
        if (a.done   !== b.done)   return a.done   - b.done;
        return b.id - a.id;
    });
};

const toggleDone = async (todo) => {
    try {
        const data = await request('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, done: !todo.done }) });
        Object.assign(todo, data.item);
        sortLocal();
    } catch (e) { error.value = e.message; }
};

const togglePinned = async (todo) => {
    try {
        const data = await request('/update', { method: 'POST', body: JSON.stringify({ id: todo.id, pinned: !todo.pinned }) });
        Object.assign(todo, data.item);
        sortLocal();
    } catch (e) { error.value = e.message; }
};

const removeTodo = async (todo) => {
    try {
        await request('/delete', { method: 'POST', body: JSON.stringify({ id: todo.id }) });
        todos.value = todos.value.filter(t => t.id !== todo.id);
    } catch (e) { error.value = e.message; }
};

onMounted(() => {
    fetchAll();
    nextTick(() => inputRef.value?.focus());
});
</script>

<template>
    <div class="flex h-full flex-col bg-bg">
        <header class="flex-none px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
            <h1 class="m-0 text-[30px] font-semibold leading-[1.15] tracking-[-0.015em] text-ink max-md:text-[24px]">Todo</h1>
        </header>

        <div class="composer mx-8 mb-2 flex flex-none items-center gap-2 rounded-[14px] bg-card px-3 py-2 transition-colors max-md:mx-3">
            <span class="msi text-muted" style="font-size:20px">add</span>
            <input
                ref="inputRef"
                v-model="newTitle"
                @keydown.enter="addTodo"
                placeholder="加一条待办,回车确认"
                class="composer-input min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[14.5px] text-ink outline-none"
            />
            <button
                class="cursor-pointer rounded-full border-0 bg-blue-bg px-4 py-1.5 text-[13px] font-medium text-blue-fg transition-colors hover:enabled:bg-blue-soft disabled:cursor-default disabled:opacity-50"
                :disabled="!newTitle.trim()" @click="addTodo">
                添加
            </button>
        </div>

        <div v-if="error" class="mx-8 mb-2 rounded-[10px] px-3.5 py-2 text-[13px] text-bad max-md:mx-3"
             style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
            {{ error }}
        </div>

        <div class="min-h-0 flex-1 overflow-auto px-8 pb-15 pt-1 max-md:px-3 max-md:pb-10">
            <div v-if="loading && !todos.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <span class="msi" style="font-size:30px;color:var(--color-faint)">hourglass_empty</span>
                <div class="text-[14px]">加载中…</div>
            </div>
            <div v-else-if="!todos.length" class="flex flex-col items-center gap-2 py-15 text-muted">
                <span class="msi" style="font-size:34px;color:var(--color-faint)">checklist</span>
                <div class="text-[14px]">还没有待办</div>
                <div class="text-[12px] text-faint">在上面输入第一条试试</div>
            </div>

            <ul v-else class="m-0 flex list-none flex-col gap-1 p-0">
                <li v-for="t in todos" :key="t.id"
                    class="item group/item flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors hover:bg-bg-hi max-md:gap-2.5 max-md:px-3 max-md:py-2"
                    :class="{ 'is-pinned': t.pinned }">
                    <button
                        class="grid h-[22px] w-[22px] flex-none cursor-pointer place-items-center rounded-full border-[1.5px] border-line-hi bg-transparent text-white transition-colors hover:border-accent"
                        :class="{ '!border-accent !bg-accent': t.done }"
                        @click="toggleDone(t)">
                        <span class="msi xs" v-if="t.done">check</span>
                    </button>

                    <span class="t-title min-w-0 flex-1 break-words text-[14.5px] text-ink"
                          :class="{ 'text-faint line-through': t.done }">
                        {{ t.title }}
                    </span>

                    <button
                        class="hover-only grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-accent"
                        :class="{ 'is-on !text-accent': t.pinned }"
                        :title="t.pinned ? '取消置顶' : '置顶'"
                        @click="togglePinned(t)">
                        <span class="msi sm" :class="{ filled: t.pinned }">push_pin</span>
                    </button>
                    <button
                        class="hover-only grid h-[30px] w-[30px] flex-none cursor-pointer place-items-center rounded-full border-0 bg-transparent text-faint transition-colors hover:bg-bg-hi hover:!text-bad"
                        title="删除"
                        @click="removeTodo(t)">
                        <span class="msi sm">close</span>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.composer:focus-within { background: var(--color-card-hi); }
.composer-input::placeholder { color: var(--color-faint); }

/* Pinned 行的 accent-tint 底 —— color-mix 写不到 Tailwind */
.item.is-pinned { background: color-mix(in srgb, var(--color-accent) 6%, transparent); }
.item.is-pinned:hover { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }

/* hover 才显的小动作按钮 —— Tailwind 的 group-hover 也行,但 .is-on 常驻显示需要状态控制,提一个 class 干净 */
.hover-only { opacity: 0; transition: opacity .15s, color .15s, background .15s; }
.item:hover .hover-only,
.hover-only.is-on { opacity: 1; }
@media (max-width: 768px) { .hover-only { opacity: 1; } }
</style>
