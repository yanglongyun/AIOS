<script setup>
defineProps({
  form: { type: Object, required: true },
  todayStr: { type: String, required: true },
  saving: { type: Boolean, default: false }
});

defineEmits(['save']);
</script>

<template>
  <section class="mb-3 rounded-lg border border-line bg-bg-elev px-4 py-3">
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
          class="h-9 w-full rounded-lg border border-line-hi bg-bg px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent"
          :placeholder="todayStr" />
      </label>
      <label class="block">
        <span class="mb-1 block text-[11px] font-medium text-faint">__T_FINANCE_NOTE__</span>
        <input
          v-model="form.newNote"
          type="text"
          class="h-9 w-full rounded-lg border border-line-hi bg-bg px-3 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent"
          placeholder="__T_FINANCE_NOTE_PLACEHOLDER__"
          @keyup.enter="$emit('save')" />
      </label>
      <label class="block">
        <span class="mb-1 block text-[11px] font-medium text-faint">__T_FINANCE_WITHDRAWAL__</span>
        <input
          v-model="form.newWithdraw"
          type="text"
          class="h-9 w-full rounded-lg border border-line-hi bg-bg px-3 text-right font-mono text-[13px] text-bad outline-none placeholder:text-faint focus:border-accent"
          placeholder="0.00"
          @keyup.enter="$emit('save')" />
      </label>
      <label class="block">
        <span class="mb-1 block text-[11px] font-medium text-faint">__T_FINANCE_DEPOSIT__</span>
        <input
          v-model="form.newDeposit"
          type="text"
          class="h-9 w-full rounded-lg border border-line-hi bg-bg px-3 text-right font-mono text-[13px] text-good outline-none placeholder:text-faint focus:border-accent"
          placeholder="0.00"
          @keyup.enter="$emit('save')" />
      </label>
      <button
        class="mt-5 inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-blue-bg px-4 text-[12.5px] font-semibold text-blue-fg transition-colors hover:bg-line-hi disabled:cursor-default disabled:opacity-45 max-lg:mt-0 max-lg:self-end"
        :disabled="saving || (!form.newWithdraw && !form.newDeposit)"
        @click="$emit('save')">
        <span class="msi sm">check</span>
        <span>{{ saving ? '__T_FINANCE_SAVING__' : '__T_COMMON_SAVE__' }}</span>
      </button>
    </div>
  </section>
</template>
