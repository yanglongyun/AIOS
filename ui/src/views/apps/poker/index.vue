<template>
  <div
    class="flex h-full min-h-full w-full flex-col items-center overflow-hidden bg-[#1a3a1a]"
    style="background-image: radial-gradient(ellipse at 50% 30%, #224422 0%, #0a150a 100%);"
  >
    <PokerTableView
      class="w-full flex-1"
      :ai-speech="aiSpeech"
      :ai-expression="aiExpression"
      :game="game"
      :economy="economy"
      :display-ai-cards="displayAiCards"
      :round-status-text="roundStatusText"
      :suit-icon="suitIcon"
      :rank-label="rankLabel"
    />
    <div class="relative z-10 -mt-4 pb-6">
      <PokerControlPanel
        :last-action-text="lastActionText"
        :game="game"
        :busy="busy"
        @start="startGame"
        @action="handleAction"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../../i18n/index.js';
import { chatPanel } from '../../../stores/chatPanel.js';
import PokerControlPanel from '../../../components/apps/poker/PokerControlPanel.vue';
import PokerTableView from '../../../components/apps/poker/PokerTableView.vue';
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

const resolveMessage = (data) => {
  if (data?.messageKey) return t(data.messageKey);
  const text = String(data?.message || '').trim();
  if (!text) {
    throw new Error('poker api 返回了空 message');
  }
  return text;
};

const loadStatus = async () => {
  const data = await request('/aios/apps/poker/status');
  if (data.success) {
    economy.value = data.economy;
  }
};

onMounted(() => {
  loadStatus();
  chatPanel.setContext({ scene: 'poker', label: t('app_sidebar_poker') });
  chatPanel.setQuickMessages([t('poker_chat_quick_1'), t('poker_chat_quick_2'), t('poker_chat_quick_3')]);
});
onUnmounted(() => { chatPanel.clearContext(); chatPanel.setQuickMessages([]); });

const startGame = async () => {
  busy.value = true;
  try {
    const data = await request('/aios/apps/poker/start', { method: 'POST' });
    if (data.success) {
      game.value = data.game;
      economy.value = data.economy || economy.value;
      lastActionText.value = t('poker_turn_start');
      aiSpeech.value = '';
      aiExpression.value = '';
      return;
    }
    lastActionText.value = resolveMessage(data);
  } catch (error) {
    const text = String(error?.message || '').trim();
    if (!text) throw new Error('poker start failed without error message');
    lastActionText.value = text;
  } finally {
    busy.value = false;
  }
};

const handleAction = async (action) => {
  if (busy.value || !game.value) return;
  busy.value = true;
  try {
    const data = await request('/aios/apps/poker/action', {
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
        else if (aiResponseAction === 'raise') lastActionText.value = t('poker_ai_raised', { 0: data.meta?.aiBet ?? '' });
        else lastActionText.value = t('poker_ai_called', { 0: data.meta?.aiBet ?? '' });
      }
      return;
    }
    lastActionText.value = resolveMessage(data);
  } catch (error) {
    const text = String(error?.message || '').trim();
    if (!text) throw new Error('poker action failed without error message');
    lastActionText.value = text;
  } finally {
    busy.value = false;
  }
};
</script>
