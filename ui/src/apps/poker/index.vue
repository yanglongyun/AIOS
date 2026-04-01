<template>
  <div class="relative h-full w-full overflow-hidden">
    <PokerTableView
      class="h-full w-full overflow-y-auto"
      :ai-speech="aiSpeech"
      :ai-expression="aiExpression"
      :game="game"
      :economy="economy"
      :display-ai-cards="displayAiCards"
      :round-status-text="roundStatusText"
      :suit-icon="suitIcon"
      :rank-label="rankLabel"
    />
    <div class="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center pb-4">
      <PokerControlPanel
        class="pointer-events-auto"
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
import { chatPanel } from '../../stores/chatPanel.js';
import PokerControlPanel from './PokerControlPanel.vue';
import PokerTableView from './PokerTableView.vue';
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
  if (!game.value) return '__T_POKER_ROUND__' + '0';
  if (game.value.status === 'done') {
    if (game.value.winner === 'player') return '__T_POKER_YOU_WIN__';
    if (game.value.winner === 'draw') return '__T_POKER_DRAW__';
    return '__T_POKER_AI_WINS__';
  }
  return '__T_POKER_ROUND__' + game.value.round;
});

const request = async (url, opts) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
};

const resolveMessage = (data) => {
  if (data?.messageKey) return data.messageKey;
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
  chatPanel.setContext({ scene: 'poker', label: '__T_APP_SIDEBAR_POKER__' });
  chatPanel.setQuickMessages(['__T_POKER_CHAT_QUICK_1__', '__T_POKER_CHAT_QUICK_2__', '__T_POKER_CHAT_QUICK_3__']);
});
onUnmounted(() => { chatPanel.clearContext(); chatPanel.setQuickMessages([]); });

const startGame = async () => {
  busy.value = true;
  try {
    const data = await request('/aios/apps/poker/start', { method: 'POST' });
    if (data.success) {
      game.value = data.game;
      economy.value = data.economy || economy.value;
      lastActionText.value = '__T_POKER_TURN_START__';
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
  aiSpeech.value = '__T_POKER_AI_THINKING__';
  aiExpression.value = '';
  if (action === 'fold') lastActionText.value = '__T_POKER_PLAYER_FOLDED_WAITING__';
  else if (action === 'raise') lastActionText.value = '__T_POKER_PLAYER_RAISED_WAITING__';
  else lastActionText.value = '__T_POKER_PLAYER_CALLED_WAITING__';
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
        lastActionText.value = '__T_POKER_GAME_OVER__';
      } else {
        if (aiResponseAction === 'fold') lastActionText.value = '__T_POKER_AI_FOLDED__';
        else if (aiResponseAction === 'raise') lastActionText.value = '__T_POKER_AI_RAISED__'.replace('{0}', data.meta?.aiBet ?? '');
        else lastActionText.value = '__T_POKER_AI_CALLED__'.replace('{0}', data.meta?.aiBet ?? '');
      }
      return;
    }
    aiSpeech.value = '';
    aiExpression.value = '';
    lastActionText.value = resolveMessage(data);
  } catch (error) {
    const text = String(error?.message || '').trim();
    if (!text) throw new Error('poker action failed without error message');
    aiSpeech.value = '';
    aiExpression.value = '';
    lastActionText.value = text;
  } finally {
    busy.value = false;
  }
};
</script>
