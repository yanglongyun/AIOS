<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useWsStore } from '@/stores/ws';

const ws = useWsStore();
const router = useRouter();

const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);
const showPassword = ref(false);
const inputRef = ref(null);

const isSetup = computed(() => !ws.configured);

const heading = computed(() => isSetup.value ? '欢迎使用 AIOS' : '请输入密码');
const subhead = computed(() => isSetup.value
    ? '首次使用,请为 AIOS 设置一个密码'
    : '');
const submitLabel = computed(() => {
    if (loading.value) return isSetup.value ? '设置中…' : '登录中…';
    return isSetup.value ? '设置密码' : '登录';
});

const localError = ref('');
const error = computed(() => localError.value || ws.authError || '');

const canSubmit = computed(() => {
    if (loading.value) return false;
    if (password.value.length < 8) return false;
    if (isSetup.value && password.value !== passwordConfirm.value) return false;
    return true;
});

async function submit() {
    localError.value = '';
    if (password.value.length < 8) {
        localError.value = '密码至少 8 位';
        return;
    }
    if (isSetup.value && password.value !== passwordConfirm.value) {
        localError.value = '两次输入的密码不一致';
        return;
    }
    loading.value = true;
    try {
        const ok = isSetup.value
            ? await ws.setupPassword(password.value)
            : await ws.login(password.value);
        if (ok) {
            password.value = '';
            passwordConfirm.value = '';
            router.replace('/');
        }
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await ws.refreshState().catch(() => {});
    if (ws.authenticated) {
        router.replace('/');
        return;
    }
    await nextTick();
    inputRef.value?.focus();
});
</script>

<template>
    <div class="flex min-h-dvh w-screen items-center justify-center bg-bg px-6 py-10">
        <div class="w-full max-w-[360px]">
            <!-- 品牌 -->
            <div class="mb-8 flex flex-col items-center gap-2">
                <div class="grid h-14 w-14 place-items-center rounded-2xl bg-bg-elev">
                    <span class="msi text-[32px] text-accent">grass</span>
                </div>
                <div class="text-[20px] font-semibold tracking-tight text-ink">
                    AIOS<span class="text-accent">.</span>
                </div>
            </div>

            <h1 class="m-0 text-center text-[22px] font-semibold tracking-tight text-ink">
                {{ heading }}
            </h1>
            <p v-if="subhead" class="mt-1.5 text-center text-[13px] text-muted">
                {{ subhead }}
            </p>

            <form class="mt-7 flex flex-col gap-3" @submit.prevent="submit">
                <label class="relative block">
                    <input
                        ref="inputRef"
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        autocomplete="current-password"
                        placeholder="密码 (至少 8 位)"
                        class="text-input w-full pr-10"
                        @input="localError = ''"
                    />
                    <button
                        type="button"
                        class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                        @click="showPassword = !showPassword"
                        :title="showPassword ? '隐藏' : '显示'">
                        <span class="msi sm">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </label>

                <input
                    v-if="isSetup"
                    v-model="passwordConfirm"
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    placeholder="再次输入密码"
                    class="text-input w-full"
                    @input="localError = ''"
                />

                <div v-if="error"
                     class="rounded-[10px] bg-[color-mix(in_srgb,var(--color-bad)_12%,transparent)] px-3 py-2 text-[13px] text-bad">
                    {{ error }}
                </div>

                <button type="submit"
                        class="save-btn mt-1 w-full"
                        :disabled="!canSubmit">
                    {{ submitLabel }}
                </button>
            </form>

            <p v-if="!isSetup" class="mt-6 text-center text-[11.5px] leading-[1.6] text-faint">
                忘记密码?在终端运行:<br/>
                <code class="rounded bg-bg-hi px-1.5 py-0.5 font-mono text-[11px]">
                    sqlite3 database/aios.db "DELETE FROM auth; DELETE FROM sessions;"
                </code>
            </p>
        </div>
    </div>
</template>
