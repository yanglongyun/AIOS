<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 里对应的真实文案。

const auth = useAuthStore();
const router = useRouter();

const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const inputRef = ref(null);

const localError = ref('');
const error = computed(() => localError.value || auth.authError || '');

const canSubmit = computed(() => {
    if (loading.value) return false;
    if (password.value.length < 8) return false;
    return true;
});

async function submit() {
    localError.value = '';
    if (password.value.length < 8) {
        localError.value = '密码至少 8 位';
        return;
    }
    loading.value = true;
    try {
        const ok = await auth.login(password.value);
        if (ok) {
            password.value = '';
            router.replace('/');
        }
    } finally {
        loading.value = false;
    }
}

onMounted(async () => {
    await auth.refreshState().catch(() => {});
    if (auth.authenticated) {
        router.replace('/');
        return;
    }
    if (!auth.configured) {
        router.replace({ name: 'welcome' });
        return;
    }
    await nextTick();
    inputRef.value?.focus();
});
</script>

<template>
    <div class="relative grid h-dvh w-screen place-items-center overflow-hidden bg-bg p-6">
        <div class="login-bg pointer-events-none absolute inset-0" aria-hidden="true"></div>

        <div class="relative flex w-full max-w-[380px] flex-col rounded-lg border border-line bg-card px-8 pb-7 pt-9 shadow-3 max-[480px]:px-5 max-[480px]:pb-[22px] max-[480px]:pt-7">

            <!-- 品牌区 -->
            <div class="mb-[22px] flex flex-col items-center">
                <div class="grid h-14 w-14 place-items-center rounded-lg bg-accent text-bg shadow-[0_0_32px_rgba(0,215,255,0.22)]">
                    <span class="msi" style="font-size:28px">eco</span>
                </div>
                <div class="mt-[14px] text-[26px] font-bold tracking-tight text-ink">
                    AIOS<span class="text-accent">.</span>
                </div>
                <div class="mt-1.5 text-[12px] tracking-[0.02em] text-muted">本地运行 · 数据归你</div>
            </div>

            <h2 class="m-0 text-center text-[20px] font-bold text-ink">欢迎回来</h2>
            <p class="m-0 text-center text-[13px] text-muted">输入密码进入你的 AIOS。</p>

            <form class="mt-5 flex flex-col gap-3.5" @submit.prevent="submit">
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
                        class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-elev hover:text-ink"
                        @click="showPassword = !showPassword"
                        :title="showPassword ? '隐藏' : '显示'">
                        <span class="msi xxs">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                </label>

                <div v-if="error"
                     class="flex items-center gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--color-bad)_10%,transparent)] px-3 py-2.5 text-[13px] leading-snug text-bad">
                    {{ error }}
                </div>

                <button type="submit"
                        :disabled="!canSubmit"
                        class="mt-1 h-11 rounded-lg border-0 bg-accent text-[14px] font-semibold tracking-[0.01em] text-bg shadow-[0_0_28px_rgba(0,215,255,0.18)] transition-[background,box-shadow,transform] active:translate-y-px hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:bg-accent">
                    {{ loading ? '登录中…' : '进入 AIOS' }}
                </button>
            </form>

            <p class="mt-[22px] text-center text-[11.5px] leading-[1.6] text-faint">
                忘记密码?在终端运行:<br/>
                <code class="mt-1 inline-block rounded-md bg-bg-elev px-2 py-0.5 font-mono text-[11px] text-muted">sqlite3 database/aios.db "DELETE FROM auth; DELETE FROM sessions;"</code>
            </p>
        </div>
    </div>
</template>

<style scoped>
/* 多层径向 + 混合渐变在 Tailwind 任意值里写出来太长且无法换行,
   下沉到 scoped style,只这两块不走 Tailwind。 */
.login-bg {
    background:
        linear-gradient(rgba(0, 215, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 215, 255, 0.05) 1px, transparent 1px),
        radial-gradient(60% 50% at 50% 0%, rgba(0,215,255,0.14) 0%, transparent 70%);
    background-size: 56px 56px, 56px 56px, auto;
}
</style>
