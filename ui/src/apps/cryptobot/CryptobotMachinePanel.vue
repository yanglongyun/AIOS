<template>
  <div class="machine-panel relative z-50 w-full max-w-[620px] shrink-0 rounded-b-[20px] border-x border-b-2 border-x-[#30363d] border-b-black px-[18px] pb-3.5 pt-4">
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <div
          class="h-2.5 w-2.5 rounded-full"
          :class="status.state.running ? 'status-light-on' : 'border border-[#30363d] bg-[#1c2128]'"
        ></div>
        <span
          class="text-[11px] font-black tracking-[2px]"
          :class="status.state.running ? 'text-[#1aab40]' : 'text-[#4a5060]'"
        >{{ status.state.running ? t('cryptobot_running') : t('cryptobot_stopped') }}</span>
      </div>
      <div class="brand-plate relative rounded-sm border border-[#868e96] px-3.5 py-[3px] text-[9px] font-black tracking-[3px] text-[#1c2128]">
        CRYPTO-TICKER
      </div>
      <button
        class="power-btn rounded px-3 py-[5px] text-[9px] font-black tracking-[1px]"
        :class="status.state.running ? 'running' : 'stopped'"
        @click="status.state.running ? $emit('stop') : $emit('start')"
      >{{ status.state.running ? '■ ' + t('cryptobot_stop') : '▶ ' + t('cryptobot_start') }}</button>
    </div>

    <div class="balance-display mb-3 flex items-center justify-between rounded-md border border-[#21262d] bg-black px-3.5 py-2.5">
      <div>
        <div class="mb-[3px] text-[8px] tracking-[2px] text-[#4a9060]">{{ t('cryptobot_equity_total') }}</div>
        <div class="balance-value text-[26px] font-black leading-none tracking-tight text-[#00ff64]">
          {{ fmtNum(status.equity.current, 2) }}<span class="ml-0.5 text-[11px] text-[#1aab40]">U</span>
        </div>
      </div>
      <div v-if="status.state.executing" class="trading-indicator text-[10px] font-black tracking-[1px] text-[#00ff64]">{{ t('cryptobot_trading') }}</div>
      <div class="flex flex-col items-end gap-0.5">
        <span class="text-[8px] tracking-[1px] text-[#3a4050]">{{ t('cryptobot_today') }}</span>
        <span
          class="text-[13px] font-black"
          :class="status.equity.today_change >= 0 ? 'text-[#00d455] [text-shadow:0_0_8px_rgba(0,212,85,0.3)]' : 'text-[#ff4d4d] [text-shadow:0_0_8px_rgba(255,77,77,0.3)]'"
        >{{ status.equity.today_change >= 0 ? '+' : '' }}{{ fmtNum(status.equity.today_change, 2) }} U</span>
      </div>
    </div>

    <div class="flex items-center gap-2.5">
      <span class="whitespace-nowrap text-[8px] tracking-[1px]" :class="status.state.running ? 'text-[#4a9060]' : 'text-[#3a4050]'">{{ t('cryptobot_next_run') }}</span>
      <div class="cycle-track flex-1 overflow-hidden rounded border border-[#21262d] bg-[#0a0e12]" style="height:8px;">
        <div
          class="h-full rounded transition-[width] duration-1000"
          :class="status.state.running
            ? 'bg-[linear-gradient(90deg,#1aab40,#00ff64)] [box-shadow:0_0_8px_rgba(0,255,100,0.5),0_0_16px_rgba(0,255,100,0.2)]'
            : 'bg-[#21262d]'"
          :style="{ width: `${countdownProgress}%` }"
        ></div>
      </div>
      <span class="whitespace-nowrap text-[11px] font-black" :class="status.state.running ? 'text-[#1aab40]' : 'text-[#4a5060]'">{{ countdownLabel }}</span>
    </div>

    <div v-if="status.state.last_error" class="mt-1.5 rounded border border-[#6a2020] bg-[#401010]/60 px-2.5 py-1.5 text-[10px] leading-snug text-[#ff6464]">
      <span class="font-black">ERR</span> {{ status.state.last_error }}
    </div>

    <button
      class="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 transition-[background,border-color,transform,box-shadow] duration-200 [box-shadow:0_3px_0_#000,0_4px_6px_rgba(0,0,0,0.4)] active:translate-y-[3px] active:[box-shadow:0_0_0_#000]"
      :class="panelOpen
        ? 'border-[#1aab40] bg-[linear-gradient(180deg,#1a3020,#0e1a10)] [box-shadow:0_3px_0_#000,0_0_10px_rgba(26,171,64,0.15)]'
        : 'border-[#3a4050] bg-[linear-gradient(180deg,#2a3038,#1e2430)] hover:bg-[linear-gradient(180deg,#323a44,#252d38)]'"
      @click="$emit('update:panelOpen', !panelOpen)"
    >
      <span class="panel-btn-icon text-[11px] transition-transform duration-300" :class="panelOpen ? 'rotate-90 text-[#00ff64]' : 'text-[#8090a0]'">▶</span>
      <span class="text-[9px] font-black tracking-[2px] transition-colors" :class="panelOpen ? 'text-[#00ff64]' : 'text-[#8090a0]'">{{ t('cryptobot_control_panel') }}</span>
      <div class="ml-auto flex gap-[3px]">
        <div class="h-1 w-1 rounded-full transition-colors" :class="panelOpen ? 'bg-[#00ff64]' : 'bg-[#4a5060]'"></div>
        <div class="h-1 w-1 rounded-full transition-colors" :class="panelOpen ? 'bg-[#00ff64]' : 'bg-[#4a5060]'"></div>
        <div class="h-1 w-1 rounded-full transition-colors" :class="panelOpen ? 'bg-[#00ff64]' : 'bg-[#4a5060]'"></div>
      </div>
    </button>

    <div class="expand-zone transition-all" :class="panelOpen ? 'open' : ''">
      <div class="expand-scroll pt-3">
        <div v-if="error" class="mb-3 rounded border border-[#6a2020] bg-[#401010] px-3 py-2 text-[11px] text-[#ff6464]">{{ error }}</div>

        <div class="field-block mb-2 rounded-[5px] border border-[#21262d] bg-[#080c10] px-3 py-2">
          <div class="mb-1.5 text-[8px] tracking-[2px] text-[#4a9060]">{{ t('cryptobot_directive') }}</div>
          <textarea
            :value="goal"
            rows="2"
            spellcheck="false"
            class="goal-input w-full resize-none border-none bg-transparent text-xs leading-relaxed text-[#c9d1d9] outline-none"
            :placeholder="t('cryptobot_directive_placeholder')"
            @input="$emit('update:goal', $event.target.value)"
            @blur="$emit('saveGoal')"
          ></textarea>
        </div>

        <div class="field-block rounded-[5px] border border-[#21262d] bg-[#080c10] px-3 py-2">
          <div class="mb-2.5 flex items-baseline justify-between">
            <div class="text-[8px] tracking-[2px] text-[#4a9060]">{{ t('cryptobot_interval') }}</div>
            <div>
              <span class="interval-value text-[15px] font-black text-[#00ff64]">{{ intervals[sliderIdx] }}</span>
              <span class="ml-0.5 text-[9px] text-[#4a9060]">{{ t('cryptobot_min_unit') }}</span>
            </div>
          </div>
          <div class="mb-1.5">
            <input
              type="range"
              class="mech-slider w-full cursor-pointer outline-none"
              min="0"
              :max="intervals.length - 1"
              step="1"
              :value="sliderIdx"
              :style="sliderBg"
              @input="$emit('sliderInput', $event.target.value)"
            />
          </div>
          <div class="flex justify-between px-0.5">
            <span
              v-for="(m, i) in intervals"
              :key="m"
              class="cursor-pointer text-[8px] transition-colors"
              :class="i === sliderIdx ? 'font-black text-[#1aab40]' : 'text-[#3a4050]'"
              @click="$emit('sliderInput', i)"
            >{{ m }}</span>
          </div>
        </div>

        <hr class="my-2.5 border-t border-dashed border-[#21262d]" />

        <div class="mb-2">
          <div class="text-[8px] font-black tracking-[2px] text-[#4a5060]">{{ t('cryptobot_exchange_config') }}</div>
        </div>
        <div class="mb-2 grid grid-cols-2 gap-1.5">
          <div class="exchange-field rounded border border-[#21262d] bg-[#080c10] px-2.5 py-1.5">
            <div class="text-[8px] tracking-[2px] text-[#4a9060]">{{ t('cryptobot_api_key') }}</div>
            <input v-model="exForm.api_key" type="text" autocomplete="off" :placeholder="t('cryptobot_api_key_placeholder')" class="exchange-input w-full border-b border-dashed border-[#30363d] bg-transparent py-0.5 text-[11px] tracking-[0.5px] text-[#c9d1d9] outline-none" @input="$emit('markExchangeDirty')" />
          </div>
          <div class="exchange-field rounded border border-[#21262d] bg-[#080c10] px-2.5 py-1.5">
            <div class="text-[8px] tracking-[2px] text-[#4a9060]">{{ t('cryptobot_passphrase') }}</div>
            <input v-model="exForm.passphrase" type="text" autocomplete="off" :placeholder="t('cryptobot_passphrase_placeholder')" class="exchange-input w-full border-b border-dashed border-[#30363d] bg-transparent py-0.5 text-[11px] tracking-[0.5px] text-[#c9d1d9] outline-none" @input="$emit('markExchangeDirty')" />
          </div>
          <div class="col-span-2 rounded border border-[#21262d] bg-[#080c10] px-2.5 py-1.5">
            <div class="text-[8px] tracking-[2px] text-[#4a9060]">{{ t('cryptobot_api_secret') }}</div>
            <input v-model="exForm.api_secret" type="text" autocomplete="off" :placeholder="t('cryptobot_api_secret_placeholder')" class="exchange-input w-full border-b border-dashed border-[#30363d] bg-transparent py-0.5 text-[11px] tracking-[0.5px] text-[#c9d1d9] outline-none" @input="$emit('markExchangeDirty')" />
          </div>
        </div>

        <hr class="my-2.5 border-t border-dashed border-[#21262d]" />
        <div class="flex items-center gap-3">
          <button
            class="whitespace-nowrap rounded border border-[#30363d] bg-[linear-gradient(180deg,#21262d,#161b22)] px-5 py-2 text-[10px] font-black tracking-[1px] text-[#8090a0] [box-shadow:0_3px_0_#000] transition-[transform,box-shadow,background] duration-150 active:translate-y-[3px] active:[box-shadow:0_0_0_#000] hover:bg-[linear-gradient(180deg,#2a3040,#1e2430)] hover:text-[#c9d1d9] disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="testingEx"
            @click="$emit('testExchange')"
          >{{ testingEx ? t('cryptobot_testing') : t('cryptobot_test_connection') }}</button>
          <span
            v-if="testResult"
            class="text-[10px] font-black tracking-[1px]"
            :class="testResult.ok ? 'text-[#00d455]' : 'text-[#ff4d4d]'"
          >{{ testResult.ok ? t('cryptobot_test_success') : '✗ ' + testResult.msg }}</span>
          <div class="flex-1"></div>
          <button
            class="rounded border border-[#1aab40] bg-[linear-gradient(180deg,#1a3020,#0e1a10)] px-6 py-2 text-[10px] font-black tracking-[2px] text-[#00ff64] [box-shadow:0_4px_0_#000,0_0_10px_rgba(0,255,100,0.15)] transition-[transform,box-shadow,background] duration-150 active:translate-y-[4px] active:[box-shadow:0_0_0_#000] hover:bg-[linear-gradient(180deg,#205030,#1a3020)] hover:[box-shadow:0_4px_0_#000,0_0_16px_rgba(0,255,100,0.25)]"
            @click="$emit('saveAll')"
          >{{ t('cryptobot_save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../../i18n/index.ts';

defineProps({
  status: { type: Object, required: true },
  error: { type: String, required: true },
  panelOpen: { type: Boolean, required: true },
  goal: { type: String, required: true },
  sliderIdx: { type: Number, required: true },
  intervals: { type: Array, required: true },
  sliderBg: { type: Object, required: true },
  countdownLabel: { type: String, required: true },
  countdownProgress: { type: Number, required: true },
  testResult: { type: Object, default: null },
  testingEx: { type: Boolean, required: true },
  exForm: { type: Object, required: true },
  fmtNum: { type: Function, required: true }
});

defineEmits([
  'update:panelOpen',
  'update:goal',
  'start',
  'stop',
  'saveGoal',
  'sliderInput',
  'testExchange',
  'markExchangeDirty',
  'saveAll'
]);

const { t } = useI18n();
</script>

<style scoped>
.machine-panel {
  background: linear-gradient(175deg, #1c2128, #12171e);
  box-shadow: 0 20px 40px rgba(0,0,0,0.9), inset 0 -2px 6px rgba(0,255,100,0.06), inset 0 1px 2px rgba(255,255,255,0.04);
}
.status-light-on {
  background: radial-gradient(circle at 30% 30%, #69ff85, #1aab40);
  box-shadow: 0 0 8px #1aab40, 0 0 16px rgba(26,171,64,0.3);
  animation: pulse-green 2s infinite;
}
@keyframes pulse-green { 0%,100%{opacity:1;} 50%{opacity:0.5;} }

.brand-plate {
  background: linear-gradient(180deg, #e9ecef, #adb5bd);
  box-shadow: 0 2px 4px rgba(0,0,0,0.6);
}
.brand-plate::before, .brand-plate::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #495057;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: inset 0 1px 1px #000;
}
.brand-plate::before { left: 4px; }
.brand-plate::after { right: 4px; }

.power-btn { box-shadow: 0 3px 0 #000; transition: background 0.15s, color 0.15s, transform 0.08s, box-shadow 0.08s; }
.power-btn:active { transform: translateY(3px); box-shadow: 0 0 0 #000; }
.power-btn.running { background: #401010; color: #ff6464; border: 1px solid #6a2020; }
.power-btn.running:hover { background: #501818; }
.power-btn.stopped { background: #1a4020; color: #00ff64; border: 1px solid #1aab40; box-shadow: 0 3px 0 #000, 0 0 8px rgba(26,171,64,0.2); }
.power-btn.stopped:hover { background: #205030; }

.balance-display { box-shadow: inset 0 3px 10px rgba(0,0,0,0.8), 0 0 8px rgba(0,255,100,0.05); }
.balance-value { text-shadow: 0 0 12px rgba(0,255,100,0.5), 0 0 24px rgba(0,255,100,0.2); }
.trading-indicator { text-shadow: 0 0 8px rgba(0,255,100,0.5); animation: pulse-trading 1.5s infinite; }
@keyframes pulse-trading { 0%,100%{opacity:1;} 50%{opacity:0.4;} }

.expand-zone { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease; }
.expand-zone.open { max-height: 45vh; opacity: 1; }
.expand-scroll { max-height: 45vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #30363d transparent; }
.expand-scroll::-webkit-scrollbar { width: 4px; }
.expand-scroll::-webkit-scrollbar-track { background: transparent; }
.expand-scroll::-webkit-scrollbar-thumb { background: #30363d; border-radius: 2px; }

.goal-input::placeholder { color: #2a3040; }
.goal-input:focus { color: #e0d0a0; }

.interval-value { text-shadow: 0 0 8px rgba(0,255,100,0.4); }
.mech-slider { -webkit-appearance: none; appearance: none; height: 6px; background: #000; border-radius: 3px; border: 1px solid #21262d; box-shadow: inset 0 2px 4px rgba(0,0,0,0.9); }
.mech-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 24px;
  background: linear-gradient(180deg, #3a4048, #21262d);
  border: 1px solid #4a5060;
  border-radius: 3px;
  box-shadow: 0 3px 0 #000, 0 0 6px rgba(0,255,100,0.15), inset 0 1px 0 rgba(255,255,255,0.1);
  cursor: pointer;
}
.mech-slider::-webkit-slider-thumb:active {
  background: linear-gradient(180deg, #1a3028, #0a1810);
  border-color: #1aab40;
  box-shadow: 0 1px 0 #000, 0 0 10px rgba(0,255,100,0.4);
}
.mech-slider::-moz-range-thumb {
  width: 18px;
  height: 24px;
  background: linear-gradient(180deg, #3a4048, #21262d);
  border: 1px solid #4a5060;
  border-radius: 3px;
  box-shadow: 0 3px 0 #000;
  cursor: pointer;
}

.exchange-input::placeholder { color: #2a3040; font-size: 10px; }
.exchange-input:focus { border-bottom-color: #1aab40; color: #e0d0a0; }
.field-block { box-shadow: inset 0 2px 6px rgba(0,0,0,0.6); }
</style>
