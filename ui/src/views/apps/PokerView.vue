<template>
  <div class="flex h-full flex-col items-center overflow-y-auto bg-[#1a3a1a] py-6 font-['Georgia','PingFang_SC',serif]" style="background-image: radial-gradient(ellipse at 50% 40%, #2a5a2a 0%, #1a3a1a 70%);">
    <div class="flex-1"></div>
    <div v-if="aiSpeech || aiExpression"
      class="mb-3 w-[600px] max-w-[96vw] cursor-pointer rounded-[10px] border-2 border-[#6a4a28] bg-[linear-gradient(180deg,#3a2a18,#2a1e10)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_4px_12px_rgba(0,0,0,.4)]"
      @click="aiThinking && (showThinking = !showThinking)">
      <div class="text-[13px] leading-relaxed text-[#d4c8a8]">{{ aiSpeech }} <span v-if="aiExpression" class="text-sm">{{ aiExpression }}</span></div>
      <div v-if="showThinking && aiThinking" class="mt-2 rounded-md bg-[rgba(0,0,0,.2)] px-3 py-2 text-[11px] italic leading-relaxed text-[#7a6a48]">
        {{ aiThinking }}
      </div>
    </div>
    <!-- 牌桌 -->
    <div class="relative w-[600px] max-w-[96vw] rounded-[40px] border-4 border-[#5a3a20] bg-[radial-gradient(ellipse_at_50%_50%,#2a6a30,#1a4a20)] p-8 shadow-[inset_0_0_60px_rgba(0,0,0,0.3),0_8px_32px_rgba(0,0,0,0.5)]">
      <!-- AI 区域 -->
      <div class="mb-6 text-center">
        <div class="mb-2 text-xs font-semibold tracking-wider text-[#a0d0a0]">AI 对手</div>
        <div class="flex justify-center gap-3">
          <div v-for="(card, i) in displayAiCards" :key="'ai'+i"
            class="flex h-[90px] w-[62px] items-center justify-center rounded-lg border-2 shadow-md transition-all duration-500"
            :class="card ? 'border-[#ddd0b0] bg-[#fffdf8]' : 'border-[#5a3a20] bg-[repeating-linear-gradient(45deg,#8a2020,#8a2020_4px,#a03030_4px,#a03030_8px)]'">
            <template v-if="card">
              <div class="text-center">
                <div class="text-lg font-bold" :class="card.suit === 'heart' || card.suit === 'diamond' ? 'text-[#cc3333]' : 'text-[#2a2a2a]'">{{ rankLabel(card.rank) }}</div>
                <div class="text-sm">{{ suitIcon(card.suit) }}</div>
              </div>
            </template>
          </div>
        </div>
        <div class="mt-2 text-xs text-[#80b080]">筹码: {{ game ? game.aiChips : economy.aiBalance }}</div>
      </div>

      <!-- 底池 -->
      <div class="my-4 text-center">
        <div class="inline-block rounded-full bg-[rgba(0,0,0,0.3)] px-6 py-2">
          <span class="text-xs text-[#a0d0a0]">底池</span>
          <span class="ml-2 text-xl font-bold text-[#ffd700]">{{ game?.pot ?? 0 }}</span>
        </div>
        <div v-if="game?.status === 'done'" class="mt-2 text-sm font-bold" :class="game.winner === 'player' ? 'text-[#ffd700]' : game.winner === 'draw' ? 'text-[#a0d0a0]' : 'text-[#ff6666]'">
          {{ game.winner === 'player' ? '你赢了！' : game.winner === 'draw' ? '平局' : 'AI 赢了' }}
        </div>
      </div>

      <!-- 玩家区域 -->
      <div class="mt-6 text-center">
        <div class="mb-2 text-xs text-[#80b080]">筹码: {{ game ? game.playerChips : economy.playerBalance }}</div>
        <div class="flex justify-center gap-3">
          <div v-for="(card, i) in (game?.playerCards || [])" :key="'p'+i"
            class="flex h-[90px] w-[62px] items-center justify-center rounded-lg border-2 border-[#ddd0b0] bg-[#fffdf8] shadow-md">
            <div class="text-center" v-if="card">
              <div class="text-lg font-bold" :class="card.suit === 'heart' || card.suit === 'diamond' ? 'text-[#cc3333]' : 'text-[#2a2a2a]'">{{ rankLabel(card.rank) }}</div>
              <div class="text-sm">{{ suitIcon(card.suit) }}</div>
            </div>
          </div>
        </div>
        <div class="mt-2 text-xs font-semibold tracking-wider text-[#c8d8a0]">你的手牌</div>
      </div>

      <!-- 操作区 -->
      <div class="mt-6 flex justify-center gap-3">
        <template v-if="!game || game.status === 'done'">
          <button @click="startGame" class="rounded-lg bg-[#c8a060] px-8 py-2.5 text-sm font-semibold text-[#1a1008] shadow-md transition hover:bg-[#d4b070]">
            {{ game ? '再来一局' : '开始游戏' }}
          </button>
        </template>
        <template v-else>
          <button @click="bet(20)" :disabled="busy" class="rounded-lg bg-[#c8a060] px-5 py-2 text-sm font-semibold text-[#1a1008] shadow transition hover:bg-[#d4b070] disabled:opacity-40">跟注 20</button>
          <button @click="bet(50)" :disabled="busy" class="rounded-lg bg-[#d4a040] px-5 py-2 text-sm font-semibold text-[#1a1008] shadow transition hover:bg-[#e0b050] disabled:opacity-40">加注 50</button>
          <button @click="compare" :disabled="busy" class="rounded-lg bg-[#6a9a5a] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#7aaa6a] disabled:opacity-40">比牌</button>
          <button @click="fold" :disabled="busy" class="rounded-lg bg-[#8a5a4a] px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#9a6a5a] disabled:opacity-40">弃牌</button>
        </template>
      </div>
    </div>

    <!-- 第几轮 -->
    <div v-if="game" class="mt-4 text-xs text-[#6a8a6a]">第 {{ game.round }} 轮</div>
    <div v-if="lastActionText" class="mt-1 text-xs text-[#9bc49b]">{{ lastActionText }}</div>
    <div class="flex-1"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { toast } from '../../stores/toast.js';

const game = ref(null);
const busy = ref(false);
const lastActionText = ref('');
const aiSpeech = ref('');
const aiExpression = ref('');
const aiThinking = ref('');
const showThinking = ref(false);
const economy = ref({ playerBalance: 0, aiBalance: 0 });

const suitIcon = (s) => ({ spade: '♠', heart: '♥', diamond: '♦', club: '♣' }[s] || '');
const rankLabel = (r) => r;

const displayAiCards = computed(() => {
  if (!game.value) return [null, null, null];
  return game.value.aiCards;
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
    if (granted > 0) toast.show(`今日补贴已到账：+${granted} 筹码`);
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
      lastActionText.value = '新牌局开始';
      aiSpeech.value = '';
      aiExpression.value = '';
      aiThinking.value = '';
      showThinking.value = false;
      return;
    }
    lastActionText.value = data.message || '开始失败';
  } catch (error) {
    lastActionText.value = error?.message || '网络异常';
  } finally {
    busy.value = false;
  }
};

const bet = async (amount) => {
  if (busy.value || !game.value) return;
  busy.value = true;
  try {
    const data = await request('/apps/poker/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: game.value.id, action: 'bet', amount })
    });
    if (data.success) {
      game.value = data.game;
      economy.value = data.economy || economy.value;
      const aiAction = data.meta?.aiAction || '';
      aiSpeech.value = data.meta?.aiSpeech || '';
      aiExpression.value = data.meta?.aiExpression || '';
      aiThinking.value = data.meta?.aiThinking || '';
      showThinking.value = false;
      if (aiAction === 'fold') lastActionText.value = `你加注 ${amount}，AI 弃牌`;
      else if (aiAction === 'call') lastActionText.value = `你加注 ${amount}，AI 跟注 ${data.meta?.aiBet ?? amount}`;
      else lastActionText.value = `你加注 ${amount}`;
      return;
    }
    lastActionText.value = data.message || '加注失败';
  } catch (error) {
    lastActionText.value = error?.message || '网络异常';
  } finally {
    busy.value = false;
  }
};

const compare = async () => {
  if (busy.value || !game.value) return;
  busy.value = true;
  try {
    const data = await request('/apps/poker/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: game.value.id, action: 'compare' })
    });
    if (data.success) {
      game.value = data.game;
      economy.value = data.economy || economy.value;
      lastActionText.value = '你选择了比牌';
      aiSpeech.value = data.meta?.aiSpeech || '';
      aiExpression.value = data.meta?.aiExpression || '';
      aiThinking.value = data.meta?.aiThinking || '';
      showThinking.value = false;
      return;
    }
    lastActionText.value = data.message || '比牌失败';
  } catch (error) {
    lastActionText.value = error?.message || '网络异常';
  } finally {
    busy.value = false;
  }
};

const fold = async () => {
  if (busy.value || !game.value) return;
  busy.value = true;
  try {
    const data = await request('/apps/poker/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: game.value.id, action: 'fold' })
    });
    if (data.success) {
      game.value = data.game;
      economy.value = data.economy || economy.value;
      lastActionText.value = '你选择了弃牌';
      aiSpeech.value = '';
      aiExpression.value = '';
      aiThinking.value = '';
      showThinking.value = false;
      return;
    }
    lastActionText.value = data.message || '弃牌失败';
  } catch (error) {
    lastActionText.value = error?.message || '网络异常';
  } finally {
    busy.value = false;
  }
};
</script>
