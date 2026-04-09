<template>
  <section class="space-y-4">
    <!-- 当前用户 -->
    <div class="flex items-center justify-between rounded-[13px] border px-4 py-3.5" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <div>
        <div class="text-[11px] font-medium uppercase tracking-wide" style="color:rgba(0,0,0,0.35)">__T_SETTINGS_CURRENT_USER__</div>
        <div class="mt-0.5 text-[14px] font-semibold" style="color:#2a1f13">{{ username || '-' }}</div>
      </div>
      <button
        @click="$emit('logout')"
        class="rounded-[8px] border px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-red-50"
        style="border-color:#fecaca;color:#dc2626"
      >__T_SETTINGS_LOGOUT__</button>
    </div>

    <!-- 修改密码 -->
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <div class="mb-3 text-[12px] font-semibold uppercase tracking-wide" style="color:rgba(0,0,0,0.35)">__T_SETTINGS_CHANGE_PASSWORD__</div>
      <div class="space-y-2.5">
        <input
          :value="oldPassword"
          @input="$emit('update:old-password', $event.target.value)"
          type="password"
          placeholder="__T_SETTINGS_OLD_PASSWORD__"
          class="s-input"
        />
        <input
          :value="newPassword"
          @input="$emit('update:new-password', $event.target.value)"
          type="password"
          placeholder="__T_SETTINGS_NEW_PASSWORD__"
          class="s-input"
        />
        <input
          :value="confirmPassword"
          @input="$emit('update:confirm-password', $event.target.value)"
          type="password"
          placeholder="__T_SETTINGS_CONFIRM_PASSWORD__"
          class="s-input"
        />
      </div>
      <div class="mt-4 flex justify-end">
        <button
          @click="$emit('change-password')"
          class="s-btn-primary"
        >__T_SETTINGS_CHANGE_PASSWORD_BTN__</button>
      </div>
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

<style scoped>
.s-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.1);
  background: #faf8f5;
  font-size: 13px;
  color: #2a1f13;
  outline: none;
  transition: border-color 0.15s;
}
.s-input::placeholder { color: rgba(0,0,0,0.25); }
.s-input:focus { border-color: #a07850; background: #fff; }

.s-btn-primary {
  padding: 8px 20px;
  border-radius: 9px;
  background: #5c4332;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}
.s-btn-primary:hover { background: #3d2a1e; }
.s-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
