<template>
  <section class="space-y-5">
    <div>
      <div class="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_CHANGE_PASSWORD__</div>
      <div class="flex flex-col gap-2.5">
        <input
          v-model="oldPassword"
          type="password"
          autocomplete="current-password"
          placeholder="__T_SETTINGS_CURRENT_PASSWORD__"
          class="text-input w-full"
          @input="clearMessage"
        />
        <input
          v-model="newPassword"
          type="password"
          autocomplete="new-password"
          placeholder="__T_SETTINGS_NEW_PASSWORD__"
          class="text-input w-full"
          @input="clearMessage"
        />
        <input
          v-model="newPasswordConfirm"
          type="password"
          autocomplete="new-password"
          placeholder="__T_SETTINGS_CONFIRM_PASSWORD__"
          class="text-input w-full"
          @input="clearMessage"
        />
      </div>

      <div v-if="message" class="mt-3 rounded-[10px] px-3 py-2 text-[13px]"
           :class="messageKind === 'error'
             ? 'bg-[color-mix(in_srgb,var(--color-bad)_12%,transparent)] text-bad'
             : 'bg-[color-mix(in_srgb,var(--color-good)_14%,transparent)] text-good'">
        {{ message }}
      </div>
    </div>

    <div class="flex justify-end">
      <button class="save-btn" :disabled="!canSubmit" @click="submit">
        {{ loading ? '__T_COMMON_SAVING__' : '__T_COMMON_SAVE__' }}
      </button>
    </div>

    <div class="border-t border-line pt-5">
      <div class="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_LOGOUT_TITLE__</div>
      <div class="flex items-center justify-between gap-3">
        <p class="m-0 max-w-[420px] text-[12.5px] leading-[1.55] text-muted">
          __T_SETTINGS_LOGOUT_DESC__
        </p>
        <button class="rounded-full border border-line-hi bg-transparent px-4 py-2 text-[13px] text-muted transition-colors hover:border-bad hover:text-bad"
                @click="onLogout">
          __T_SETTINGS_LOGOUT__
        </button>
      </div>
    </div>

    <div class="border-t border-line pt-5">
      <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted">__T_SETTINGS_FORGOT_PASSWORD__</div>
      <p class="m-0 text-[12.5px] leading-[1.6] text-muted">
        __T_SETTINGS_FORGOT_PASSWORD_DESC__
      </p>
      <pre class="mt-2 m-0 overflow-x-auto rounded-lg bg-bg-hi px-3 py-2 font-mono text-[12px] text-ink">sqlite3 database/aios.db "DELETE FROM auth; DELETE FROM sessions;"</pre>
      <p class="mt-2 m-0 text-[11.5px] text-faint">
        __T_SETTINGS_FORGOT_PASSWORD_HINT__
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useWsStore } from '@/stores/ws';

const ws = useWsStore();
const router = useRouter();

const oldPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');
const loading = ref(false);

const message = ref('');
const messageKind = ref('success');   // 'success' | 'error'

function clearMessage() { message.value = ''; }

const canSubmit = computed(() => {
  if (loading.value) return false;
  if (!oldPassword.value) return false;
  if (newPassword.value.length < 8) return false;
  if (newPassword.value !== newPasswordConfirm.value) return false;
  return true;
});

async function submit() {
  loading.value = true;
  message.value = '';
  try {
    const ok = await ws.changePassword(oldPassword.value, newPassword.value);
    if (ok) {
      messageKind.value = 'success';
      message.value = '__T_SETTINGS_PASSWORD_UPDATED__';
      oldPassword.value = '';
      newPassword.value = '';
      newPasswordConfirm.value = '';
    } else {
      messageKind.value = 'error';
      message.value = ws.authError || '__T_COMMON_UPDATE_FAILED__';
    }
  } finally {
    loading.value = false;
  }
}

async function onLogout() {
  await ws.logout();
  router.replace({ name: 'login' });
}
</script>
