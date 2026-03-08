<template>
  <div class="relative h-full w-full overflow-hidden bg-[#f4f3f0] font-serif">
    <!-- ===== 开始页面 ===== -->
    <div v-if="!debateStarted" class="h-full min-h-0 overflow-y-auto bg-[#eceae5] p-4">
      <div class="mx-auto w-full max-w-[480px] overflow-hidden rounded-md bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
        <!-- 深蓝金顶栏 -->
        <div class="relative bg-[#1c2841] px-8 pb-7 pt-8 text-center text-[#c9b06b] after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-[linear-gradient(90deg,transparent,#c9b06b,transparent)]">
          <h1 class="mb-1.5 text-[26px] font-bold tracking-[3px]">🃏 纸牌屋</h1>
          <p class="text-xs tracking-wide text-[#8a9ab5]">House of Cards</p>
        </div>

        <div class="px-7 pb-8 pt-7">
          <div class="mb-5 rounded border border-[#e8e6e0] bg-[#f8f7f4] px-4 py-3.5 text-[13px] leading-[1.8] text-[#4a5568]">
            {{ t('debate_intro') }}
          </div>
          <div class="mb-2.5 text-[10px] font-semibold uppercase tracking-[3px] text-[#8a9ab5]">{{ t('debate_select_party') }}</div>

          <!-- 党派列表 -->
          <div class="mb-6">
            <div
              v-for="party in parties"
              :key="party.id"
              @click="selectPartyItem(party)"
              class="mb-1 flex cursor-pointer items-center gap-3 rounded border px-3.5 py-2.5 transition-all"
              :class="candidateParty === party.name
                ? 'border-[#c9b06b] bg-[#f0efe8] shadow-[inset_3px_0_0_#c9b06b]'
                : 'border-[#e8e6e0] hover:border-[#ccc] hover:bg-[#f8f7f4]'"
            >
              <img
                v-if="party.logo && !failedLogoIds.has(party.id)"
                :src="party.logo"
                @error="markLogoFailed(party.id)"
                class="h-7 w-7 object-contain"
              />
              <span v-else class="text-2xl">🏛️</span>
              <div class="flex-1">
                <div class="text-sm font-bold text-[#1c2841]">{{ party.name }}</div>
                <div class="text-[11px] text-[#8a9ab5]">{{ party.difficulty }} · {{ t('debate_wins') }} {{ party.win_count }}</div>
              </div>
              <div class="text-right">
                <div class="text-base font-bold text-[#1c2841]">{{ party.support_rate }}%</div>
                <div class="text-[10px] text-[#8a9ab5]">{{ t('debate_support_rate') }}</div>
              </div>
            </div>
          </div>

          <div class="mb-2.5 text-[10px] font-semibold uppercase tracking-[3px] text-[#8a9ab5]">{{ t('debate_candidate_name') }}</div>
          <input
            v-model="candidateName"
            type="text"
            :placeholder="t('debate_enter_name')"
            class="mb-5 w-full rounded border border-[#d8d6d0] bg-white px-3.5 py-3 font-serif text-[15px] text-[#1c2841] outline-none placeholder:text-[#bbb] focus:border-[#c9b06b]"
          />

          <button
            @click="startDebate"
            :disabled="!candidateParty || !candidateName || preparing"
            class="w-full rounded bg-[#1c2841] py-3.5 font-serif text-base font-bold tracking-[2px] text-[#c9b06b] transition-colors hover:bg-[#263556] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="preparing">{{ t('debate_preparing') }}</span>
            <span v-else>{{ t('debate_start') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 辩论页面 ===== -->
    <div v-if="debateStarted" class="absolute inset-0 flex flex-col bg-[#f4f3f0]">
      <!-- 顶部深蓝栏 -->
      <div class="shrink-0 border-b-[3px] border-[#c9b06b] bg-[#1c2841] text-[#c9b06b]">
        <div class="border-b border-white/[0.06] py-1.5 text-center text-[11px] tracking-[4px] text-[#8a9ab5]">
          {{ t('debate_title') }} · {{ t('debate_nationwide') }}
        </div>

        <div class="flex items-stretch">
          <!-- 己方 -->
          <div class="flex flex-1 items-center gap-2.5 px-5 py-3.5">
            <div class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-2 border-[#c9b06b] text-lg font-bold text-[#c9b06b]">
              {{ candidateName?.charAt(0) }}
            </div>
            <div>
              <div class="text-base font-bold text-[#e8e6e0]">{{ candidateName }}</div>
              <div class="text-[11px] text-[#8a9ab5]">{{ candidateParty }}</div>
            </div>
            <div class="ml-auto text-2xl font-bold text-[#c9b06b]">
              {{ getCurrentSupportRate('candidate') }}%
              <small class="block text-[10px] font-normal text-[#8a9ab5]">{{ t('debate_support_rate') }}</small>
            </div>
          </div>
          <!-- 对方 -->
          <div class="flex flex-1 flex-row-reverse items-center gap-2.5 border-l border-white/[0.06] px-5 py-3.5 text-right">
            <div class="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-2 border-[#c9b06b] text-lg font-bold text-[#c9b06b]">
              {{ opponentName?.charAt(0) }}
            </div>
            <div>
              <div class="text-base font-bold text-[#e8e6e0]">{{ opponentName }}</div>
              <div class="text-[11px] text-[#8a9ab5]">{{ opponentParty }}</div>
            </div>
            <div class="mr-auto text-2xl font-bold text-[#c9b06b]">
              {{ getCurrentSupportRate('opponent') }}%
              <small class="block text-[10px] font-normal text-[#8a9ab5]">{{ t('debate_support_rate') }}</small>
            </div>
          </div>
        </div>

        <!-- 议题进度 -->
        <div class="flex items-center gap-2 bg-black/20 px-5 py-2">
          <template v-for="(topic, i) in topics" :key="i">
            <div
              class="h-2 w-2 rounded-full"
              :class="i < currentTopic - 1 ? 'bg-[#6b9a6b]'
                : i === currentTopic - 1 ? 'bg-[#c9b06b] shadow-[0_0_6px_rgba(201,176,107,0.4)]'
                : 'bg-white/15'"
            />
          </template>
          <span class="ml-1 text-[11px] text-[#8a9ab5]">
            {{ t('debate_topic') }} {{ currentTopic }}/{{ topics.length }} · {{ topics[currentTopic - 1]?.topicName }}
          </span>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto px-5 py-4">
        <template v-for="(topic, topicIndex) in topics" :key="topicIndex">
          <div v-if="topic.status">
            <!-- 议题分隔线 -->
            <div class="my-4 flex items-center gap-3 text-xs text-[#8a9ab5]">
              <span class="h-px flex-1 bg-[#d8d6d0]"></span>
              {{ topic.topicName }} ({{ topicIndex + 1 }}/{{ topics.length }})
              <span class="h-px flex-1 bg-[#d8d6d0]"></span>
            </div>

            <template v-for="(message, index) in topic.messages" :key="index">
              <!-- 己方发言 -->
              <div v-if="message.role === 'candidate'" class="mb-3 ml-auto flex max-w-[82%] flex-row-reverse gap-2">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1c2841] text-[13px] font-bold text-[#c9b06b]">
                  {{ message.name?.charAt(0) }}
                </div>
                <div class="rounded-[12px_12px_4px_12px] bg-[#1c2841] px-3.5 py-2.5 text-sm leading-relaxed text-[#e8e6e0]">
                  <div class="mb-0.5 text-[10px] font-bold text-[#c9b06b]/70">{{ message.name }}</div>
                  {{ message.content }}
                </div>
              </div>
              <!-- 对方发言 -->
              <div v-else-if="message.role === 'opponent'" class="mb-3 mr-auto flex max-w-[82%] gap-2">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8b2020] text-[13px] font-bold text-[#f0d0d0]">
                  {{ message.name?.charAt(0) }}
                </div>
                <div class="rounded-[12px_12px_12px_4px] border border-[#e0ddd6] bg-white px-3.5 py-2.5 text-sm leading-relaxed text-[#1c2841]">
                  <div class="mb-0.5 text-[10px] font-bold text-[#8a9ab5]">{{ message.name }}</div>
                  {{ message.content }}
                </div>
              </div>
              <!-- 主持人 -->
              <div v-else-if="message.role === 'moderator'" class="mx-auto mb-3 max-w-[88%]">
                <div class="rounded-lg border border-[#e0ddd6] bg-[#f8f7f4] px-3.5 py-2.5 text-center text-sm leading-relaxed text-[#6a7a8a]">
                  <div class="mb-0.5 text-[10px] font-bold not-italic text-[#8a9ab5]">{{ t('debate_moderator') }}</div>
                  {{ message.content }}
                </div>
              </div>
              <!-- 媒体 -->
              <div v-else-if="message.role === 'media'" class="mx-auto mb-3 max-w-[88%]">
                <div class="rounded-r-lg border-l-[3px] border-[#c9b06b] bg-white px-3.5 py-2.5 text-center text-sm leading-relaxed text-[#6a7a8a]">
                  <div class="mb-0.5 text-[10px] font-bold text-[#8a9ab5]">📺 {{ t('debate_media') }}</div>
                  {{ message.content }}
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- 输入区域 -->
      <div class="shrink-0 border-t border-[#e0ddd6] bg-white px-5 pb-3.5 pt-2.5">
        <div v-if="isMyTurn && suggestions.length" class="mb-2 flex flex-wrap gap-2">
          <button
            v-for="(tip, idx) in suggestions"
            :key="`${idx}-${tip.title}`"
            @click="applySuggestion(tip)"
            class="rounded-full border border-[#d7cfbe] bg-[#f8f7f4] px-3 py-1 text-xs text-[#5b6880] transition-colors hover:border-[#c9b06b] hover:text-[#1c2841]"
          >
            {{ tip.title }}
          </button>
        </div>

        <!-- 输入状态 -->
        <div v-if="isMyTurn" class="flex items-end gap-2 rounded-xl border border-[#e0ddd6] bg-[#f8f7f4] py-1 pl-3.5 pr-1">
          <button
            @click="generateSuggestions"
            :disabled="generatingSuggestions"
            class="mb-1 shrink-0 rounded-full border border-[#d7cfbe] bg-white px-3 py-1 text-xs text-[#5b6880] transition-colors hover:border-[#c9b06b] hover:text-[#1c2841] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ generatingSuggestions ? t('debate_generating') : t('debate_suggest') }}
          </button>

          <textarea
            ref="messageInput"
            v-model="newMessage"
            rows="1"
            :placeholder="t('debate_enter_statement')"
            @input="autoResize"
            @keydown.enter.prevent="speak"
            class="max-h-[120px] min-h-[22px] flex-1 resize-none border-none bg-transparent py-2 font-serif text-sm text-[#1c2841] outline-none placeholder:text-[#bbb]"
          />

          <button
            @click="speak"
            :disabled="!newMessage.trim()"
            class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-colors"
            :class="newMessage.trim() ? 'bg-[#1c2841] text-[#c9b06b] cursor-pointer hover:bg-[#263556]' : 'bg-[#e8e6e0] text-[#bbb] cursor-not-allowed'"
          >
            <SendHorizontal class="h-5 w-5" />
          </button>
        </div>

        <!-- AI思考中 -->
        <div v-else-if="aiThinking" class="flex items-center justify-center rounded-xl border border-[#e0ddd6] bg-[#f8f7f4] py-4">
          <div class="inline-flex items-center gap-1">
            <span class="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#c9b06b] [animation-delay:0ms]" />
            <span class="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#c9b06b] [animation-delay:200ms]" />
            <span class="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#c9b06b] [animation-delay:400ms]" />
          </div>
        </div>

        <!-- 辩论结束 -->
        <div v-else-if="debateEnded" class="flex items-center justify-center rounded-xl py-1" :class="won ? 'bg-[#1c2841]' : 'bg-[#8b2020]'">
          <button @click="showResults = true" class="min-h-[36px] font-serif font-bold leading-[36px] tracking-wide text-[#c9b06b]">
            {{ won ? t('debate_show_victory_speech') : t('debate_show_failure_reason') }}
          </button>
        </div>

        <!-- 等待状态 -->
        <div v-else class="flex items-center justify-center rounded-xl border border-dashed border-[#e0ddd6] bg-[#f8f7f4] py-3.5">
          <span class="text-sm text-[#8a9ab5]">{{ t('debate_waiting') }}</span>
        </div>
      </div>
    </div>

    <!-- ===== 结果弹窗 ===== -->
    <div v-if="showResults" class="absolute inset-0 z-50 flex items-center justify-center bg-[#1c2841]/50 p-4 backdrop-blur-sm">
      <div class="w-full max-w-[440px] overflow-hidden rounded-md bg-white shadow-[0_8px_40px_rgba(0,0,0,0.15)]">
        <!-- 顶部色条 -->
        <div class="h-[3px]" :class="won ? 'bg-[linear-gradient(90deg,transparent,#c9b06b,transparent)]' : 'bg-[linear-gradient(90deg,transparent,#8b2020,transparent)]'"></div>

        <!-- 深蓝头部 -->
        <div class="bg-[#1c2841] px-7 pb-5 pt-7 text-center" :class="won ? 'text-[#c9b06b]' : 'text-[#d09090]'">
          <button @click="closeResults" class="absolute right-3 top-3 text-[#8a9ab5] hover:text-white">
            <X class="h-5 w-5" />
          </button>
          <div class="mb-2 text-5xl">{{ won ? '🏛️' : '📉' }}</div>
          <div class="mb-1 text-[22px] font-bold tracking-[2px]">{{ won ? t('debate_victory') : t('debate_failure') }}</div>
          <div class="mt-4 text-[44px] font-bold">
            {{ getCurrentSupportRate('candidate') }}%
            <small class="mt-1 block text-xs font-normal text-[#8a9ab5]">{{ t('debate_final_support_rate') }}</small>
          </div>
        </div>

        <!-- 内容 -->
        <div class="max-h-[220px] overflow-y-auto px-7 py-5 text-sm leading-relaxed text-[#4a5568]">
          <template v-if="won">
            <div class="whitespace-pre-wrap" v-html="victorySpeech"></div>
          </template>
          <template v-else>
            <div class="whitespace-pre-wrap" v-html="failureReason"></div>
          </template>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2.5 px-7 pb-6 pt-4">
          <button @click="closeResults" class="flex-1 rounded border border-[#d8d6d0] bg-[#f4f3f0] py-3 font-serif text-sm font-bold text-[#6a7a8a]">
            {{ t('debate_close') }}
          </button>
          <button @click="resetGame" class="flex-1 rounded bg-[#1c2841] py-3 font-serif text-sm font-bold text-[#c9b06b]">
            {{ won ? t('debate_challenge_again') : t('debate_try_again') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== 准备中 ===== -->
    <div v-if="preparing" class="absolute inset-0 z-50 flex items-center justify-center bg-[#1c2841]/50 p-4 backdrop-blur-sm">
      <div class="rounded-md bg-white px-8 py-6 shadow-lg">
        <div class="flex items-center gap-3">
          <div class="h-7 w-7 animate-spin rounded-full border-2 border-[#c9b06b] border-t-transparent"></div>
          <span class="font-serif text-lg text-[#1c2841]">{{ t('debate_preparing_debate') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';
import { SendHorizontal, X } from 'lucide-vue-next';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();

const API_BASE = '/apps/debate';
const parties = ref([]);
const selectedParty = ref(null);
const candidateName = ref('');
const candidateParty = ref('');
const opponentName = ref('');
const opponentParty = ref('');
const debateStarted = ref(false);
const preparing = ref(false);
const topics = ref([]);
const currentTopic = ref(1);
const debateId = ref('');
const isMyTurn = ref(false);
const aiThinking = ref(false);
const debateEnded = ref(false);
const won = ref(false);
const showResults = ref(false);
const newMessage = ref('');
const suggestions = ref([]);
const generatingSuggestions = ref(false);
const victorySpeech = ref('');
const failureReason = ref('');
const chatContainer = ref(null);
const messageInput = ref(null);
const failedLogoIds = ref(new Set());

const markLogoFailed = (id) => {
  if (!id) return;
  const next = new Set(failedLogoIds.value);
  next.add(id);
  failedLogoIds.value = next;
};

onMounted(() => {
  debateId.value = generateDebateId(16);
  loadParties().then(() => restoreLatestDebate());
});

const request = async (url, body = {}, method = 'POST') => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const loadParties = async () => {
  try {
    parties.value = await request(`${API_BASE}/parties`, { lang: 'zh' });
  } catch (error) {
    console.error(t('debate_load_parties_failed'), error);
  }
};

const selectPartyItem = (party) => {
  candidateParty.value = party.name;
  selectedParty.value = party;
};

const restoreLatestDebate = async () => {
  try {
    const data = await request(`${API_BASE}/latest`, {}, 'GET');
    if (!data?.success || !data?.session || !Array.isArray(data.topics) || !data.topics.length) return;

    debateId.value = data.session.debateId || generateDebateId(16);
    candidateName.value = data.session.candidateName || '';
    candidateParty.value = data.session.candidateParty || '';
    opponentName.value = data.session.opponentName || '';
    opponentParty.value = data.session.opponentParty || '';
    selectedParty.value = parties.value.find((p) => p.name === candidateParty.value) || null;

    topics.value = data.topics;
    currentTopic.value = Number(data.currentTopic || topics.value.length || 1);
    debateStarted.value = true;
    preparing.value = false;
    debateEnded.value = Boolean(data.sessionEnded);
    isMyTurn.value = false;
    aiThinking.value = false;

    await scrollToBottom();
    if (!debateEnded.value) startDebateLoop();
  } catch (error) {
    console.error(t('debate_restore_failed'), error);
  }
};

const startDebate = async () => {
  if (!candidateParty.value || !candidateName.value) return;
  preparing.value = true;
  try {
    const selectedCandidateParty = selectedParty.value;
    const availableParties = parties.value.filter((p) => p.name !== candidateParty.value);
    const randomOpponent = availableParties[Math.floor(Math.random() * availableParties.length)];
    opponentParty.value = randomOpponent.name;
    opponentName.value = randomOpponent.candidate_name;

    const data = await request(`${API_BASE}/start`, {
      debateId: debateId.value,
      candidateName: candidateName.value,
      candidateParty: candidateParty.value,
      opponentName: opponentName.value,
      opponentParty: opponentParty.value
    });

    topics.value = (data.topics || []).map((topic, index) => ({
      topicName: topic,
      messages: [],
      status: index === 0,
      candidateSupportRate: index === 0 ? selectedCandidateParty.support_rate : 0,
      opponentSupportRate: index === 0 ? randomOpponent.support_rate : 0,
      candidatePolicy: ''
    }));

    topics.value[0].messages.push({ role: 'moderator', name: t('debate_moderator'), content: data.prologue || '' });
    await saveMessage('moderator', t('debate_moderator'), data.prologue || '');
    debateStarted.value = true;
    preparing.value = false;
    await scrollToBottom();
    startDebateLoop();
  } catch (error) {
    console.error(t('debate_start_failed'), error);
    preparing.value = false;
  }
};

const startDebateLoop = async () => {
  while (true) {
    const topicInfo = getTopicInfo();
    try {
      const data = await request(`${API_BASE}/debate`, { topicInfo });
      if (data.action === 'candidate') {
        suggestions.value = [];
        isMyTurn.value = true;
        await nextTick();
        messageInput.value?.focus();
        break;
      } else if (data.action === 'opponent') {
        addMessage('opponent', opponentName.value, data.content);
        await saveMessage('opponent', opponentName.value, data.content);
      } else if (data.action === 'moderator') {
        addMessage('moderator', t('debate_moderator'), data.content);
        await saveMessage('moderator', t('debate_moderator'), data.content);
      } else if (data.action === 'next') {
        await summaryCurrentTopic();
        break;
      } else {
        break;
      }
      await scrollToBottom();
    } catch (error) {
      console.error(t('debate_loop_error'), error);
      break;
    }
  }
};

const speak = async () => {
  if (!newMessage.value.trim()) return;
  isMyTurn.value = false;
  suggestions.value = [];
  const message = newMessage.value.trim();
  addMessage('candidate', candidateName.value, message);
  await saveMessage('candidate', candidateName.value, '', message);
  newMessage.value = '';
  await scrollToBottom();
  startDebateLoop();
};

const summaryCurrentTopic = async () => {
  try {
    const data = await request(`${API_BASE}/summary`, { topicInfo: getTopicInfo() });
    addMessage('media', t('debate_media_label'), data.summary || '');
    await saveMessage('media', t('debate_media_label'), data.summary || '');
    const currentTopicIndex = currentTopic.value - 1;
    topics.value[currentTopicIndex].candidatePolicy = data.policy || '';

    if (currentTopic.value === topics.value.length) {
      await finishDebate();
    } else {
      topics.value[currentTopic.value].candidateSupportRate = Number(data.poll?.[0]?.vote || 0);
      topics.value[currentTopic.value].opponentSupportRate = Number(data.poll?.[1]?.vote || 0);
      await continueToNextTopic();
    }
  } catch (error) {
    console.error(t('debate_summary_failed'), error);
  }
};

const continueToNextTopic = async () => {
  const prevTopic = topics.value[currentTopic.value - 1].topicName;
  const newTopic = topics.value[currentTopic.value].topicName;
  const candidateInfo = `${t('debate_candidate')}：${candidateParty.value} - ${candidateName.value}，${t('debate_support_rate')}：${topics.value[currentTopic.value].candidateSupportRate}%\n${t('debate_opponent')}：${opponentParty.value} - ${opponentName.value}，${t('debate_support_rate')}：${topics.value[currentTopic.value].opponentSupportRate}%`;
  try {
    const data = await request(`${API_BASE}/continue`, { prevTopic, newTopic, candidateInfo });
    topics.value[currentTopic.value].status = true;
    topics.value[currentTopic.value].messages.push({ role: 'moderator', name: t('debate_moderator'), content: data.content || '' });
    currentTopic.value++;
    await scrollToBottom();
    startDebateLoop();
  } catch (error) {
    console.error(t('debate_continue_failed'), error);
  }
};

const finishDebate = async () => {
  const idx = currentTopic.value - 1;
  const finalSupportRate = Number(topics.value[idx].candidateSupportRate || 0);
  const policy = topics.value.map((topic) => `${t('debate_topic')}: ${topic.topicName} - ${t('debate_position')}: ${topic.candidatePolicy} - ${t('debate_support_rate')}: ${topic.candidateSupportRate}% - ${t('debate_opponent_support_rate')}: ${topic.opponentSupportRate}%`).join('\n');
  try {
    const data = await request(`${API_BASE}/finish`, {
      debateId: debateId.value,
      candidateParty: candidateParty.value,
      candidateName: candidateName.value,
      supportRate: finalSupportRate,
      policy,
      candidateSupportRate: topics.value[idx].candidateSupportRate,
      opponentSupportRate: topics.value[idx].opponentSupportRate,
      endTime: new Date().toISOString()
    });
    if (finalSupportRate > 50) {
      won.value = true;
      victorySpeech.value = data.content || '';
    } else {
      failureReason.value = data.content || '';
    }
    debateEnded.value = true;
    showResults.value = true;
  } catch (error) {
    console.error(t('debate_finish_failed'), error);
  }
};

const addMessage = (role, name, content) => {
  const idx = currentTopic.value - 1;
  topics.value[idx].messages.push({ role, name, content });
};

const saveMessage = async (speakerRole, speakerName, content, draft = '') => {
  try {
    await request(`${API_BASE}/save`, {
      debateId: debateId.value,
      topicName: topics.value[currentTopic.value - 1].topicName,
      speakerRole,
      speakerName,
      content,
      draft
    });
  } catch (error) {
    console.error('保存消息失败:', error);
  }
};

const getTopicInfo = () => {
  const idx = currentTopic.value - 1;
  const currentCandidateInfo = `${candidateParty.value} - ${candidateName.value}，${t('debate_party_position')}：${selectedParty.value?.policy}，${t('debate_current_support_rate')}：${topics.value[idx].candidateSupportRate}%`;
  const opponentInfo = `${opponentParty.value} - ${opponentName.value}，${t('debate_current_support_rate')}：${topics.value[idx].opponentSupportRate}%`;
  const candidateInfo = `${t('debate_candidate_info_label')}:\n${currentCandidateInfo}\n${t('debate_opponent_info_label')}:\n${opponentInfo}\n\n`;
  const topicInfo = `${t('debate_topic')}:\n${topics.value[idx].topicName}\n\n`;
  const messages = topics.value[idx].messages;
  const latest = messages.length > 0 ? messages[messages.length - 1] : null;
  const latestInfo = latest ? `${t('debate_latest_statement')}:\n${latest.name}: ${latest.content}\n` : '';
  const recent = messages.slice(0, -1).map((m, i) => `${i + 1}. ${m.name}: ${m.content}`).join('\n');
  return `${candidateInfo}${topicInfo}${t('debate_recent_statements')}:\n${recent}\n\n${latestInfo}`;
};

const getCurrentSupportRate = (type) => {
  const idx = Math.max(0, currentTopic.value - 1);
  return type === 'candidate'
    ? Number(topics.value[idx]?.candidateSupportRate || 0)
    : Number(topics.value[idx]?.opponentSupportRate || 0);
};

const autoResize = async () => {
  await nextTick();
  const el = messageInput.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

const normalizeSuggestionItems = (list = []) => {
  const out = [];
  for (const item of Array.isArray(list) ? list : []) {
    if (item && typeof item === 'object') {
      const title = String(item.title || '').trim();
      const content = String(item.content || '').trim();
      if (title && content) out.push({ title, content });
    } else {
      const text = String(item || '').trim();
      if (text) out.push({ title: `${t('debate_suggest')} ${out.length + 1}`, content: text });
    }
    if (out.length >= 3) break;
  }
  return out;
};

const generateSuggestions = async () => {
  if (generatingSuggestions.value) return;
  generatingSuggestions.value = true;
  try {
    const data = await request(`${API_BASE}/suggest`, {
      topicInfo: getTopicInfo(),
      draft: newMessage.value
    });
    suggestions.value = normalizeSuggestionItems(data?.suggestions);
  } catch (error) {
    console.error(t('debate_generate_suggestions_failed'), error);
  } finally {
    generatingSuggestions.value = false;
  }
};

const applySuggestion = async (tip) => {
  newMessage.value = String(tip?.content || '').trim();
  await autoResize();
  messageInput.value?.focus();
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
};

const generateDebateId = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const closeResults = () => { showResults.value = false; };

const resetGame = () => {
  debateStarted.value = false;
  preparing.value = false;
  topics.value = [];
  currentTopic.value = 1;
  isMyTurn.value = false;
  aiThinking.value = false;
  debateEnded.value = false;
  won.value = false;
  showResults.value = false;
  newMessage.value = '';
  suggestions.value = [];
  generatingSuggestions.value = false;
  victorySpeech.value = '';
  failureReason.value = '';
  candidateName.value = '';
  candidateParty.value = '';
  selectedParty.value = null;
  debateId.value = generateDebateId(16);
};
</script>
