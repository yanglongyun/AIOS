<template>
  <section class="space-y-4">
    <div class="rounded-lg border border-black/[0.08] bg-white p-3">
      <div class="mb-2 flex items-center justify-between gap-2">
        <div class="text-xs text-black/40">__T_SETTINGS_CURRENT_USER__</div>
        <button
          @click="$emit('logout')"
          class="px-3 py-1 rounded-lg text-[12px] font-medium border border-red-200 text-red-600 cursor-pointer hover:bg-red-50 transition-colors"
        >__T_SETTINGS_LOGOUT__</button>
      </div>
      <div class="text-[13px] font-semibold text-[#222]">
        {{ username || '-' }}
      </div>
    </div>

    <div>
      <div class="text-xs font-medium text-black/40 mb-2">__T_SETTINGS_CHANGE_PASSWORD__</div>
      <div class="space-y-2">
        <input
          :value="oldPassword"
          @input="$emit('update:old-password', $event.target.value)"
          type="password"
          placeholder="__T_SETTINGS_OLD_PASSWORD__"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 bg-transparent text-[13px] text-[#222] placeholder:text-black/25 outline-none focus:border-[#222] transition-colors"
        />
        <input
          :value="newPassword"
          @input="$emit('update:new-password', $event.target.value)"
          type="password"
          placeholder="__T_SETTINGS_NEW_PASSWORD__"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 bg-transparent text-[13px] text-[#222] placeholder:text-black/25 outline-none focus:border-[#222] transition-colors"
        />
        <input
          :value="confirmPassword"
          @input="$emit('update:confirm-password', $event.target.value)"
          type="password"
          placeholder="__T_SETTINGS_CONFIRM_PASSWORD__"
          class="w-full px-3 py-2.5 rounded-lg border border-black/10 bg-transparent text-[13px] text-[#222] placeholder:text-black/25 outline-none focus:border-[#222] transition-colors"
        />
      </div>
    </div>

    <div class="pt-2 flex items-center justify-start gap-2">
      <button
        @click="$emit('change-password')"
        class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-[#222] text-white cursor-pointer hover:bg-black transition-colors"
      >__T_SETTINGS_CHANGE_PASSWORD_BTN__</button>
    </div>
  </section>
</template>

<script setup>
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
