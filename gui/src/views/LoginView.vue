<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Sprout, Eye, EyeOff } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

// 这个组件只在已经设置过密码后使用,所以走烘焙占位符。
// 烘焙脚本 scripts/start.mjs 会把 __T_LOGIN_*__ 替换成 language/<locale>/gui/views/login.json
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
        localError.value = '__T_LOGIN_PASSWORD_SHORT__';
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
    <div class="relative grid h-dvh w-screen place-items-center overflow-hidden bg-[#f6f8fb] p-6">
        <!-- 装饰背景:上下两层柔光 + 中央 orb -->
        <div class="login-bg pointer-events-none absolute inset-0" aria-hidden="true"></div>
        <div class="login-orb pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-[55%] rounded-full" aria-hidden="true"></div>

        <div class="relative flex w-full max-w-[380px] flex-col rounded-[22px] border border-black/5 bg-white px-8 pb-7 pt-9 shadow-[0_18px_50px_-20px_rgba(60,64,67,0.18)] max-[480px]:rounded-[18px] max-[480px]:px-5 max-[480px]:pb-[22px] max-[480px]:pt-7">

            <!-- 品牌区 -->
            <div class="mb-[22px] flex flex-col items-center">
                <div class="grid h-14 w-14 place-items-center rounded-[18px] bg-[linear-gradient(140deg,#34a853,#1e8e3e)] text-white shadow-[0_14px_40px_-16px_rgba(52,168,83,0.85)]">
                    <Sprout :size="28" :stroke-width="1.7" />
                </div>
                <div class="mt-[14px] text-[26px] font-bold tracking-tight text-ink">
                    AIOS<span class="text-[#34a853]">.</span>
                </div>
                <div class="mt-1.5 text-[12px] tracking-[0.02em] text-muted">__T_LOGIN_TAGLINE__</div>
            </div>

            <h2 class="m-0 text-center text-[20px] font-bold text-ink">__T_LOGIN_TITLE__</h2>
            <p class="m-0 text-center text-[13px] text-muted">__T_LOGIN_SUBHEAD__</p>

            <form class="mt-5 flex flex-col gap-3.5" @submit.prevent="submit">
                <label class="relative block">
                    <input
                        ref="inputRef"
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        autocomplete="current-password"
                        placeholder="__T_LOGIN_PASSWORD_PLACEHOLDER__"
                        class="text-input w-full pr-10"
                        @input="localError = ''"
                    />
                    <button
                        type="button"
                        class="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-elev hover:text-ink"
                        @click="showPassword = !showPassword"
                        :title="showPassword ? '__T_LOGIN_HIDE__' : '__T_LOGIN_SHOW__'">
                        <component :is="showPassword ? EyeOff : Eye" :size="16" :stroke-width="1.8" />
                    </button>
                </label>

                <div v-if="error"
                     class="flex items-center gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--color-bad)_10%,transparent)] px-3 py-2.5 text-[13px] leading-snug text-bad">
                    {{ error }}
                </div>

                <button type="submit"
                        :disabled="!canSubmit"
                        class="mt-1 h-11 rounded-xl border-0 bg-[#1a73e8] text-[14px] font-semibold tracking-[0.01em] text-white shadow-[0_6px_18px_-8px_rgba(26,115,232,0.65)] transition-[background,box-shadow,transform] active:translate-y-px hover:bg-[#174ea6] hover:shadow-[0_10px_24px_-10px_rgba(26,115,232,0.8)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:bg-[#1a73e8]">
                    {{ loading ? '__T_LOGIN_SUBMITTING__' : '__T_LOGIN_SUBMIT__' }}
                </button>
            </form>

            <p class="mt-[22px] text-center text-[11.5px] leading-[1.6] text-faint">
                __T_LOGIN_FORGOT__<br/>
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
        radial-gradient(60% 50% at 50% 0%, rgba(52,168,83,0.10) 0%, transparent 70%),
        radial-gradient(70% 60% at 50% 100%, rgba(26,115,232,0.10) 0%, transparent 70%);
}
.login-orb {
    background: radial-gradient(circle, rgba(52,168,83,0.18) 0%, transparent 65%);
    filter: blur(40px);
}
</style>
