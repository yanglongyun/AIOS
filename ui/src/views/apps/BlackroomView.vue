<template>
  <div class="h-full w-full overflow-y-auto bg-[#0c0c0c] text-[#a3a3a3] flex flex-col items-center relative [scrollbar-color:#333_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#333]">
    
    <!-- Background Noise Texture -->
    <div class="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E')]"></div>

    <div class="z-10 w-full flex flex-col items-center flex-1 py-10 px-5 max-w-lg">
      
      <!-- Top Toolbar / Entry -->
      <header class="w-full flex justify-between items-center mb-10">
        <div class="text-[11px] font-black tracking-widest text-[#444] uppercase flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#dc2626]"></div>
          {{ t('blackroom_title') }}
        </div>

      </header>
      
      <!-- Poop Trigger Zone -->
      <div class="flex flex-col items-center mb-6">
        <div class="text-[80px] leading-none cursor-pointer select-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-transform duration-100 ease-in-out active:scale-90 active:translate-y-1 hover:drop-shadow-[0_15px_25px_rgba(250,204,21,0.1)]" @click="hitPoop" ref="mainPoopBtn">💩</div>
        <div class="mt-3 text-[11px] text-[#555] tracking-widest uppercase font-bold">{{ t('blackroom_instruction') }}</div>
      </div>
      
      <!-- Slip Island (Top Down Layout) -->
      <section class="w-full bg-[#141414] border border-[#282828] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        
        <!-- Top Half: Poop Grid Accumulation -->
        <div class="w-full border-b border-[#282828] flex flex-col min-h-[110px] max-h-[180px] transition-colors duration-300" :style="{ backgroundColor: topPaneBg }">
          

          
          <div class="flex-1 px-4 py-3 flex flex-wrap content-start gap-[6px] overflow-y-auto [scrollbar-color:#333_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#333]" ref="poopGridContainer">
            <div v-if="poopCount === 0" class="text-[#444] text-[11px] w-full text-center mt-4">{{ t('blackroom_waiting_poop') }}</div>
            <div v-for="n in poopCount" :key="n" class="text-[16px] leading-none poop-anim">💩</div>
          </div>
        </div>
        
        <!-- Bottom Half: Input & Action -->
        <div class="flex flex-col relative w-full">
          <textarea
            v-model="complaint"
            class="w-full bg-transparent border-none p-4 text-[#e5e5e5] text-[14px] leading-relaxed font-medium resize-none outline-none min-h-[120px] placeholder:text-[#555]"
            :placeholder="t('blackroom_placeholder')"
            @input="error = ''"
          />
          
          <div class="px-4 py-3 bg-[#111] border-t border-dashed border-[#282828] flex justify-end items-center">
            <div class="flex-1 text-[11px] text-[#c77]">{{ error }}</div>
            <button
              class="px-4 py-2 text-[#422006] rounded-md text-[13px] font-black tracking-widest cursor-pointer transition-all duration-150 active:scale-95 disabled:bg-[#282828] disabled:text-[#555] disabled:cursor-not-allowed disabled:active:scale-100"
              :class="isSubmitEnabled ? 'bg-[#facc15] hover:bg-[#eab308]' : 'bg-[#282828]'"
              :disabled="!isSubmitEnabled || submitting"
              @click="submit"
            >
              {{ submitting ? t('blackroom_submitting') : t('blackroom_submit') }}
            </button>
          </div>
        </div>
        
      </section>



    </div>

    <!-- Agent Response Dialog (AI Return) -->
    <div v-if="showResponseDialog" class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 dialog-overlay">
      <div class="w-full max-w-sm rounded-xl border border-[#333] bg-[#1a1a1a] shadow-2xl p-6 flex flex-col items-center text-center dialog-content">
        <div class="mb-4 text-[40px] leading-none text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">🧠</div>
        <div class="mb-8 text-[#ccc] text-[14px] font-medium leading-relaxed px-2">{{ agentResponseText }}</div>
        <button
          class="w-full rounded-md bg-[#facc15] py-2.5 text-[13px] font-black tracking-widest text-[#422006] hover:bg-[#eab308] active:scale-95 transition-all outline-none"
          @click="showResponseDialog = false"
        >
          确定 (OK)
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.poop-anim {
  opacity: 0;
  transform: scale(0);
  animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.dialog-overlay {
  animation: fadeIn 0.2s ease-out forwards;
}

.dialog-content {
  animation: popIn 0.2s ease-out forwards;
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0); }
  60% { transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
</style>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { t, locale } = useI18n();

const API_BASE = '/apps/blackroom';

const complaint = ref('');
const poopCount = ref(0);
const MAX_POOP = 50;
const submitting = ref(false);
const error = ref('');

const showResponseDialog = ref(false);
const agentResponseText = ref('');



const poopGridContainer = ref(null);
const mainPoopBtn = ref(null);

const topPaneBg = computed(() => {
  const ratio = poopCount.value / MAX_POOP;
  const rPart = Math.floor(26 + 80 * ratio); // from #1a1a1a to slightly red
  return `rgba(${rPart}, 20, 20, 1)`;
});

const countColor = computed(() => {
  const ratio = poopCount.value / MAX_POOP;
  return ratio > 0.8 ? '#ef4444' : '#facc15';
});

const isSubmitEnabled = computed(() => {
  return poopCount.value > 0 || complaint.value.trim().length > 0;
});

const hitPoop = async () => {
  if (poopCount.value >= MAX_POOP) {
    if (mainPoopBtn.value) {
      mainPoopBtn.value.style.transform = 'scale(0.9) translateY(4px) translateX(-5px)';
      setTimeout(() => mainPoopBtn.value.style.transform = 'scale(0.9) translateY(4px) translateX(5px)', 50);
      setTimeout(() => mainPoopBtn.value.style.transform = '', 100);
    }
    return;
  }
  
  if (mainPoopBtn.value) {
    mainPoopBtn.value.style.transform = 'scale(0.9) translateY(4px)';
    setTimeout(() => { if (mainPoopBtn.value) mainPoopBtn.value.style.transform = ''; }, 100);
  }

  poopCount.value++;
  error.value = '';
  
  await nextTick();
  if (poopGridContainer.value) {
    poopGridContainer.value.scrollTop = poopGridContainer.value.scrollHeight;
  }
};



const request = async (url, options = {}) => {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok || data.success === false) throw new Error(data.message || `HTTP ${resp.status}`);
  return data;
};



const submit = async () => {
  if (!isSubmitEnabled.value || submitting.value) return;
  submitting.value = true;
  error.value = '';
  try {
    const data = await request(`${API_BASE}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint: complaint.value,
        poopCount: poopCount.value
      })
    });
    
    agentResponseText.value = data.agentResponse || '记录已收到，系统将会反思。';
    showResponseDialog.value = true;
    
    complaint.value = '';
    poopCount.value = 0;
  } catch (e) {
    error.value = e.message || t('blackroom_submit_failed');
  } finally {
    submitting.value = false;
  }
};
</script>
