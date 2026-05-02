<script setup>
defineProps({
  form: { type: Object, required: true },
  todayStr: { type: String, required: true },
  saving: { type: Boolean, default: false }
});

defineEmits(['save']);
</script>

<template>
  <section class="finance-entry mb-3 px-4 py-3">
    <div class="mb-2 flex items-center gap-2">
      <span class="msi sm text-faint">add_card</span>
      <span class="text-[13px] font-semibold text-ink">__T_FINANCE_NEW_RECORD__</span>
    </div>
    <div class="grid grid-cols-[120px_minmax(180px,1fr)_140px_140px_auto] gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
      <label class="block">
        <span class="mb-1 block text-[11px] font-medium text-faint">__T_FINANCE_DATE__</span>
        <input
          v-model="form.newDate"
          type="text"
          class="finance-input h-9 w-full border-0 px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/30"
          :placeholder="todayStr" />
      </label>
      <label class="block">
        <span class="mb-1 block text-[11px] font-medium text-faint">__T_FINANCE_NOTE__</span>
        <input
          v-model="form.newNote"
          type="text"
          class="finance-input h-9 w-full border-0 px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/30"
          placeholder="__T_FINANCE_NOTE_PLACEHOLDER__"
          @keyup.enter="$emit('save')" />
      </label>
      <label class="block">
        <span class="mb-1 block text-[11px] font-medium text-faint">__T_FINANCE_EXPENSE__</span>
        <input
          v-model="form.newWithdraw"
          type="text"
          class="finance-input h-9 w-full border-0 px-3 text-right font-mono text-[13px] text-bad outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/30"
          placeholder="0.00"
          @keyup.enter="$emit('save')" />
      </label>
      <label class="block">
        <span class="mb-1 block text-[11px] font-medium text-faint">__T_FINANCE_DEPOSIT__</span>
        <input
          v-model="form.newDeposit"
          type="text"
          class="finance-input h-9 w-full border-0 px-3 text-right font-mono text-[13px] text-good outline-none placeholder:text-faint focus:ring-2 focus:ring-accent/30"
          placeholder="0.00"
          @keyup.enter="$emit('save')" />
      </label>
      <button
        class="finance-save mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 border-0 px-4 text-[12.5px] font-semibold text-blue-fg transition-colors disabled:cursor-default disabled:opacity-45 max-lg:mt-0 max-lg:self-end"
        :disabled="saving || (!form.newWithdraw && !form.newDeposit)"
        @click="$emit('save')">
        <span class="msi sm">check</span>
        <span>{{ saving ? '__T_FINANCE_SAVING__' : '__T_COMMON_SAVE__' }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.finance-entry {
  border: 1px solid color-mix(in srgb, var(--color-line) 86%, white);
  border-radius: 18px;
  background:
    linear-gradient(145deg, color-mix(in srgb, white 38%, transparent), transparent 40%),
    color-mix(in srgb, var(--color-bg-elev) 92%, var(--color-bg-hi));
  box-shadow:
    0 14px 34px color-mix(in srgb, var(--color-ink) 7%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 55%, transparent);
}
.finance-input {
  border-radius: 13px;
  background: color-mix(in srgb, var(--color-bg) 88%, var(--color-bg-hi));
  box-shadow:
    inset 0 2px 7px color-mix(in srgb, var(--color-ink) 8%, transparent),
    inset 0 -1px 0 color-mix(in srgb, white 42%, transparent);
}
.finance-input:focus {
  background: var(--color-bg);
}
.finance-save {
  border-radius: 13px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--color-blue-bg) 86%, white), var(--color-blue-bg));
  box-shadow:
    0 10px 20px color-mix(in srgb, var(--color-accent) 15%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 45%, transparent);
}
.finance-save:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: inset 0 2px 8px color-mix(in srgb, var(--color-accent) 18%, transparent);
}
</style>
