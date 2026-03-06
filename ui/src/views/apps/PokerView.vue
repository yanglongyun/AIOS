<template>
  <div
    class="flex h-full flex-col items-center overflow-y-auto bg-[#1a3a1a] py-2 sm:py-4 font-['Georgia','PingFang_SC',serif]"
    style="background-image: radial-gradient(ellipse at 50% 30%, #224422 0%, #0a150a 100%);">
    <div class="flex-1"></div>

    <!-- AI 对话浮窗 (上方居中) -->
    <div v-if="aiSpeech || aiExpression"
      class="relative z-10 -mb-4 w-[500px] max-w-[90vw] rounded-2xl border border-[#c8a060]/30 bg-gradient-to-b from-[#2a1e10]/90 to-[#150f08]/90 p-3 sm:p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div class="flex items-start gap-3 sm:gap-4">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c8a060] text-lg font-bold text-[#1a1008] shadow-[0_0_15px_rgba(200,160,96,0.3)]">
          AI</div>
        <div>
          <div class="text-[14px] leading-relaxed tracking-wide text-[#e8d4b8]">
            {{ aiSpeech }} <span v-if="aiExpression" class="text-sm">{{ aiExpression }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 牌桌主体 Oval Table -->
    <div
      class="relative flex w-[700px] max-w-[96vw] flex-col items-center justify-between rounded-[40px] sm:rounded-[60px] border-[4px] sm:border-[6px] border-[#3a2010] bg-[radial-gradient(ellipse_at_50%_50%,#2a6a30_0%,#153a1a_100%)] p-4 sm:p-6 pt-6 sm:pt-8 shadow-[inset_0_0_80px_rgba(0,0,0,0.6),0_20px_50px_rgba(0,0,0,0.5)]">

      <!-- AI 区域 -->
      <div class="flex w-full flex-col items-center relative gap-2">
        <div class="flex flex-col items-center gap-0.5 rounded-xl bg-black/30 px-4 py-1">
          <span class="text-[10px] uppercase tracking-widest text-[#80b080]">{{ t('poker_ai_stack') }}</span>
          <span class="font-mono text-base sm:text-lg font-bold text-[#d4b878]">{{ game ? game.aiChips :
            economy.aiBalance }}</span>
        </div>
        <div class="flex gap-2">
          <!-- 暗牌 -->
          <div v-for="(card, i) in displayAiCards" :key="'ai' + i"
            class="flex h-[80px] w-[55px] sm:h-[90px] sm:w-[60px] items-center justify-center rounded-lg border-2 shadow-lg transition-transform hover:-translate-y-2"
            :class="card ? 'border-[#ddd0b0] bg-[#fffdf8] ' + (i === 0 ? '-rotate-6' : (i === 2 ? 'rotate-6' : '')) : 'border-[#5a3a20] bg-[repeating-linear-gradient(45deg,#8a2020,#8a2020_4px,#a03030_4px,#a03030_8px)] ' + (i === 0 ? '-rotate-6' : (i === 2 ? 'rotate-6' : ''))">
            <template v-if="card">
              <div class="text-center">
                <div class="text-xl sm:text-2xl font-bold"
                  :class="card.suit === 'heart' || card.suit === 'diamond' ? 'text-[#cc3333]' : 'text-[#2a2a2a]'">{{
                    rankLabel(card.rank) }}</div>
                <div class="text-base sm:text-lg"
                  :class="card.suit === 'heart' || card.suit === 'diamond' ? 'text-[#cc3333]' : 'text-[#2a2a2a]'">{{
                    suitIcon(card.suit) }}</div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 赌注池 (中心) -->
      <div class="my-3 sm:my-5 flex flex-col items-center relative shrink-0">
        <div
          class="absolute w-[160px] sm:w-[220px] h-[160px] sm:h-[220px] rounded-full border border-white/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        </div>
        <div
          class="absolute w-[120px] sm:w-[160px] h-[120px] sm:h-[160px] rounded-full border border-white/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        </div>

        <span class="text-[10px] uppercase tracking-widest text-[#a0d0a0] mb-1 z-10">{{ t('poker_total_pot') }}</span>
        <div
          class="z-10 flex items-center gap-2 rounded-full border border-[#c8a060]/40 bg-[#c8a060]/10 px-5 sm:px-6 py-1.5 sm:py-2 shadow-[0_0_20px_rgba(200,160,96,0.15)] backdrop-blur">
          <span
            class="text-xl sm:text-2xl font-bold font-mono text-[#ffd700] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{{
              game?.pot ?? 0 }}</span>
        </div>
        <span class="z-10 mt-1 sm:mt-2 text-[10px] sm:text-xs text-[#6a8a6a] tracking-widest font-bold">
          {{ roundStatusText }}
        </span>
      </div>

      <!-- 玩家区域 -->
      <div class="flex w-full flex-col items-center relative gap-2">
        <!-- 玩家手牌 (扇形展开) -->
        <div class="group flex gap-[-10px]">
          <template v-if="game?.playerCards?.length">
            <div v-for="(card, i) in game.playerCards" :key="'p' + i"
              class="flex h-[90px] w-[62px] sm:h-[100px] sm:w-[68px] flex-col items-center justify-center rounded-xl border border-[#e8d4b8] bg-white text-center shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-transform group-hover:-translate-y-3"
              :class="i === 0 ? '-rotate-6 translate-x-[10px] z-10' : (i === 1 ? 'z-20' : 'rotate-6 -translate-x-[10px] z-30')">
              <div class="text-lg sm:text-xl font-bold"
                :class="card.suit === 'heart' || card.suit === 'diamond' ? 'text-[#cc3333]' : 'text-[#2a2a2a]'">{{
                  rankLabel(card.rank) }}</div>
              <div class="text-base sm:text-lg"
                :class="card.suit === 'heart' || card.suit === 'diamond' ? 'text-[#cc3333]' : 'text-[#2a2a2a]'">{{
                  suitIcon(card.suit) }}</div>
            </div>
          </template>
        </div>

        <div class="flex flex-col items-center gap-0.5 rounded-xl bg-black/30 px-4 py-1 mt-1">
          <span class="text-[10px] uppercase tracking-widest text-[#80b080]">{{ t('poker_your_stack') }}</span>
          <span class="font-mono text-base sm:text-lg font-bold text-[#d4b878]">{{ game ? game.playerChips :
            economy.playerBalance }}</span>
        </div>
      </div>
    </div>

    <!-- 底部操作区 (悬浮控制台) -->
    <div
      class="relative z-10 -mt-4 w-[600px] max-w-[96vw] rounded-2xl border border-[#4a3a28] bg-gradient-to-t from-[#1a1410] to-[#251d18] p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
      <div v-if="lastActionText && game?.status !== 'done'"
        class="text-center mb-3 text-[11px] sm:text-[12px] tracking-wide text-[#9bc49b]">{{ lastActionText }}</div>
      <div v-if="!game || game.status === 'done'" class="flex flex-col items-center mt-1">
        <div class="mb-3 text-[11px] sm:text-xs text-[#8a7a58]/80 leading-relaxed text-center px-2">
          <p>{{ t('poker_game_rules') }} <span class="text-[#c8a060] font-bold">{{ t('poker_call') }}</span>、<span
              class="text-[#a07a4a] font-bold">{{ t('poker_raise') }}</span> {{ t('poker_or') }} <span
              class="text-[#8a5a4a] font-bold">{{ t('poker_fold') }}</span>。</p>
          <p class="mt-0.5">{{ t('poker_rules_round_limit') }} <span class="text-[#c8a060] font-bold">{{
            t('poker_rules_max_round') }}</span>{{ t('poker_rules_auto_compare') }}</p>
        </div>
        <button @click="startGame" :disabled="busy"
          class="w-full sm:w-auto rounded-xl bg-[#c8a060] px-8 py-2.5 text-[14px] font-bold tracking-wider text-[#1a1008] shadow-[0_4px_15px_rgba(200,160,96,0.3)] transition-all hover:-translate-y-1 hover:bg-[#d4b070] disabled:opacity-40">
          {{ game ? t('poker_play_again') : t('poker_start') }}
        </button>
      </div>
      <div v-else class="flex justify-center gap-2 sm:gap-3">
        <button @click="handleAction('call')" :disabled="busy"
          class="flex-1 rounded-xl bg-[#c8a060] py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-bold tracking-wider text-[#1a1008] shadow-[0_4px_15px_rgba(200,160,96,0.3)] transition-all hover:-translate-y-1 hover:bg-[#d4b070] disabled:opacity-40 disabled:hover:translate-y-0">
          {{ t('poker_call') }}
        </button>
        <button @click="handleAction('raise')" :disabled="busy"
          class="flex-1 rounded-xl bg-[#a07a4a] py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-bold tracking-wider text-[#1a1008] shadow-[0_4px_15px_rgba(160,122,74,0.3)] transition-all hover:-translate-y-1 hover:bg-[#b58c58] disabled:opacity-40 disabled:hover:translate-y-0">
          {{ t('poker_raise') }}
        </button>
        <button @click="handleAction('fold')" :disabled="busy"
          class="flex-1 rounded-xl border border-[#8a5a4a] bg-transparent py-2 sm:py-2.5 text-[12px] sm:text-[13px] font-bold tracking-wider text-[#8a5a4a] transition-all hover:-translate-y-1 hover:bg-[#8a5a4a] hover:text-white disabled:opacity-40 disabled:hover:translate-y-0">
          {{ t('poker_fold') }}
        </button>
      </div>
    </div>

    <div class="flex-1"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from '../../i18n/index.js';
import { toast } from '../../stores/toast.js';

const { t } = useI18n();

const game = ref(null);
const busy = ref(false);
const lastActionText = ref('');
const aiSpeech = ref('');
const aiExpression = ref('');
const economy = ref({ playerBalance: 0, aiBalance: 0 });

const suitIcon = (s) => ({ spade: '♠', heart: '♥', diamond: '♦', club: '♣' }[s] || '');
const rankLabel = (r) => r;

const displayAiCards = computed(() => {
  if (!game.value) return [null, null, null];
  return game.value.aiCards;
});

const roundStatusText = computed(() => {
  if (!game.value) return t('poker_round') + '0';
  if (game.value.status === 'done') {
    if (game.value.winner === 'player') return t('poker_you_win');
    if (game.value.winner === 'draw') return t('poker_draw');
    return t('poker_ai_wins');
  }
  return t('poker_round') + game.value.round;
});

const request = async (url, opts) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
};

const loadStatus = async () => {
  const data = await request('/apps/poker/status');
  if (data.success) {
    economy.value = data.economy;
    const granted = Number(data.grant?.player || 0);
    if (granted > 0) toast.show(t('poker_daily_grant').replace('{0}', granted));
  }
};

onMounted(loadStatus);

const startGame = async () => {
  busy.value = true;
  try {
    const data = await request('/apps/poker/start', { method: 'POST' });
    if (data.success) {
      game.value = data.game;
      economy.value = data.economy || economy.value;
      lastActionText.value = t('poker_turn_start');
      aiSpeech.value = '';
      aiExpression.value = '';
      return;
    }
    lastActionText.value = data.message || t('poker_start_failed');
  } catch (error) {
    lastActionText.value = error?.message || t('poker_network_error');
  } finally {
    busy.value = false;
  }
};

const handleAction = async (action) => {
  if (busy.value || !game.value) return;
  busy.value = true;
  try {
    const data = await request('/apps/poker/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: game.value.id, action })
    });
    if (data.success) {
      game.value = data.game;
      economy.value = data.economy || economy.value;
      const aiResponseAction = data.meta?.aiAction || '';
      aiSpeech.value = data.meta?.aiSpeech || '';
      aiExpression.value = data.meta?.aiExpression || '';

      if (game.value.status === 'done') {
        lastActionText.value = t('poker_game_over');
      } else {
        if (aiResponseAction === 'fold') lastActionText.value = t('poker_ai_folded');
        else if (aiResponseAction === 'raise') lastActionText.value = t('poker_ai_raised').replace('{0}', data.meta?.aiBet ?? '');
        else lastActionText.value = t('poker_ai_called').replace('{0}', data.meta?.aiBet ?? '');
      }
      return;
    }
    lastActionText.value = data.message || t('poker_action_failed');
  } catch (error) {
    lastActionText.value = error?.message || t('poker_network_error');
  } finally {
    busy.value = false;
  }
};
</script>
