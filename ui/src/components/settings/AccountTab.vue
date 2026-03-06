<template>
  <section class="space-y-4">
    <div class="rounded-lg border border-[#e8dcc8] dark:border-[#2a1e14] bg-[#fcfaf6] dark:bg-[#17110d] p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="text-xs text-[#a0907a] dark:text-[#6a5840]">{{ t('settings_current_user') }}</div>
        <button
          @click="$emit('logout')"
          class="px-3 py-1 rounded-lg text-[12px] font-medium border border-[#d9b7a8] text-[#8f4f35] dark:border-[#5b3426] dark:text-[#d59575] cursor-pointer hover:opacity-85 transition-opacity"
        >{{ t('settings_logout') }}</button>
      </div>
      <div class="text-[13px] font-semibold text-[#5a3e28] dark:text-[#c8a060]">
        {{ username || '-' }}
      </div>
    </div>

    <div>
      <div class="text-xs font-medium text-[#a0907a] dark:text-[#6a5840] mb-2">{{ t('settings_change_password') }}</div>
      <div class="space-y-2">
        <input
          :value="oldPassword"
          @input="$emit('update:old-password', $event.target.value)"
          type="password"
          :placeholder="t('settings_old_password')"
          class="w-full px-3 py-2.5 rounded-lg border border-[#dcd0b8] dark:border-[#2a1e14] bg-transparent text-[13px] text-[#5a3e28] dark:text-[#c8a060] placeholder:text-[#b8a888] dark:placeholder:text-[#6a5840] outline-none focus:border-[#b08a40] dark:focus:border-[#c8a060] transition-colors"
        />
        <input
          :value="newPassword"
          @input="$emit('update:new-password', $event.target.value)"
          type="password"
          :placeholder="t('settings_new_password')"
          class="w-full px-3 py-2.5 rounded-lg border border-[#dcd0b8] dark:border-[#2a1e14] bg-transparent text-[13px] text-[#5a3e28] dark:text-[#c8a060] placeholder:text-[#b8a888] dark:placeholder:text-[#6a5840] outline-none focus:border-[#b08a40] dark:focus:border-[#c8a060] transition-colors"
        />
        <input
          :value="confirmPassword"
          @input="$emit('update:confirm-password', $event.target.value)"
          type="password"
          :placeholder="t('settings_confirm_password')"
          class="w-full px-3 py-2.5 rounded-lg border border-[#dcd0b8] dark:border-[#2a1e14] bg-transparent text-[13px] text-[#5a3e28] dark:text-[#c8a060] placeholder:text-[#b8a888] dark:placeholder:text-[#6a5840] outline-none focus:border-[#b08a40] dark:focus:border-[#c8a060] transition-colors"
        />
      </div>
    </div>

    <div class="pt-2 flex items-center justify-start gap-2">
      <button
        @click="$emit('change-password')"
        class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-br from-[#c8a060] to-[#a07840] text-[#1a1410] cursor-pointer hover:opacity-85 transition-opacity"
      >{{ t('settings_change_password_btn') }}</button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();

defineProps({
  username: { type: String, default: '' },
  oldPassword: { type: String, default: '' },
  newPassword: { type: String, default: '' },
  confirmPassword: { type: String, default: '' }
});

defineEmits([
  'update:old-password',
  'update:new-password',
  'update:confirm-password',
  'change-password',
  'logout'
]);
</script>
