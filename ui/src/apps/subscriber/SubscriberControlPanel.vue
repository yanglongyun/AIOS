<template>
  <div>
    <div class="mb-3 flex shrink-0 items-center justify-center">
      <div class="text-[10px] font-black uppercase tracking-[0.3em] text-[#a08040]" style="text-shadow:0 1px 0 rgba(0,0,0,0.3);">{{ t('subscriber_title') }}</div>
    </div>

    <div class="dial-strip">
      <div class="shrink-0 text-center" :class="{ 'status-receiving': refreshing }">
        <div class="na-label text-[8px] leading-none tracking-widest text-[#806040]">
          {{ refreshing ? 'ON AIR' : 'NEXT ON AIR' }}
        </div>
        <div class="na-value mt-0.5 text-[14px] font-black text-[#e8c060]" style="text-shadow:0 0 10px rgba(232,192,96,0.5);">
          {{ refreshing ? t('subscriber_refreshing') : scheduleTimeStr }}
        </div>
      </div>

      <div class="dial-scale">
        <div class="dial-scale-inner"></div>
        <div class="needle-schedule" :style="{ left: schedulePercent + '%' }"></div>
        <div class="needle-now" :style="{ left: nowPercent + '%' }"></div>
      </div>

      <button class="flex shrink-0 items-center bg-transparent p-1 text-[#806040] transition-colors duration-200 hover:text-[#e8c060]" @click="$emit('toggle-settings')" :title="t('subscriber_focus_label')">
        <svg class="h-[18px] w-[18px] transition-transform duration-300 [filter:drop-shadow(0_0_3px_rgba(232,192,96,0.3))]" :class="showSettings ? 'rotate-90' : ''" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>
    </div>

    <div class="expand-panel" :class="{ 'is-open': showSettings }">
      <div class="control-panel mt-3">
        <div class="mb-3">
          <div class="mb-1.5 text-[9px] font-black tracking-widest text-[#8a7a50]">{{ t('subscriber_focus_label') }}</div>
          <div class="speaker-grille-input">
            <textarea :value="focus" rows="2" class="grille-textarea" :placeholder="t('subscriber_focus_placeholder')" @input="$emit('update:focus', $event.target.value)"></textarea>
          </div>
        </div>
        <div class="mb-4">
          <div class="mb-1.5 text-[9px] font-black tracking-widest text-[#8a7a50]">{{ t('subscriber_schedule_label') }}</div>
          <input type="time" :value="scheduleTime" class="w-full rounded border-2 border-[#0a0804] bg-[#1a0e04] px-3 py-2 font-['Courier_New',monospace] text-[13px] font-bold text-[#e8c060] [text-shadow:0_0_6px_rgba(232,192,96,0.3)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all placeholder:text-[#4a3418] focus:border-[#3a2510] focus:shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_0_0_1px_rgba(232,192,96,0.15)]" @input="$emit('update:scheduleTime', $event.target.value)" />
        </div>
        <div class="flex gap-3">
          <button class="relative top-0 flex-1 whitespace-nowrap rounded-md border-2 border-[#3a2510] bg-[linear-gradient(180deg,#6a4a28_0%,#4a3218_100%)] py-[9px] text-xs font-black tracking-[0.08em] text-[#d8c090] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_3px_0_#2a1a08,0_4px_8px_rgba(0,0,0,0.4)] transition-all active:top-[3px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_#2a1a08,0_1px_3px_rgba(0,0,0,0.3)]" @click="$emit('save-focus')">{{ t('subscriber_save_button') }}</button>
          <button class="relative top-0 flex-1 whitespace-nowrap rounded-md border-2 border-[#701808] bg-[linear-gradient(180deg,#d84020_0%,#a02808_100%)] py-[9px] text-[12px] font-black tracking-[0.1em] text-[#fde8d8] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)] shadow-[inset_0_2px_0_rgba(255,255,255,0.15),0_3px_0_#501008,0_4px_8px_rgba(0,0,0,0.4)] transition-all active:top-[3px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_0_#501008,0_1px_3px_rgba(0,0,0,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:top-0" :disabled="refreshing" @click="$emit('refresh')">{{ t('subscriber_refresh_button') }}</button>
        </div>
        <div v-if="error" class="mt-3 rounded border border-[#701808] bg-[#2a1008] px-3 py-2 text-[11px] text-[#e88060]">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js';

defineProps({
  refreshing: { type: Boolean, required: true },
  scheduleTimeStr: { type: String, required: true },
  schedulePercent: { type: Number, required: true },
  nowPercent: { type: Number, required: true },
  showSettings: { type: Boolean, required: true },
  focus: { type: String, required: true },
  scheduleTime: { type: String, required: true },
  error: { type: String, required: true }
});

defineEmits(['toggle-settings', 'update:focus', 'update:scheduleTime', 'save-focus', 'refresh']);

const { t } = useI18n();
</script>
