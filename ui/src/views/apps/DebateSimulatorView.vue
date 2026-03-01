<template>
  <div class="min-h-screen bg-gray-50 dark:bg-neutral-900">
    <div v-if="!debateStarted" class="flex min-h-screen items-center justify-center p-4">
      <div class="w-full max-w-md rounded-lg border border-gray-300 bg-white p-8 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
        <h1 class="mb-6 text-center text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-300">竞选模拟器</h1>
        <p class="mb-6 text-center leading-relaxed text-gray-700 dark:text-neutral-300">
          你将担任党派候选人，与竞争对手进行电视辩论。辩论结束后支持率超过 50%，将获得就职演讲。
        </p>

        <div class="space-y-6">
          <div class="space-y-4 text-center">
            <img v-if="selectedParty" :src="selectedParty.logo" alt="党派标志" class="mx-auto h-28 w-auto object-contain" />
            <div v-if="selectedParty" class="space-y-2">
              <p class="text-lg font-semibold text-gray-800 dark:text-neutral-100">
                {{ selectedParty.name }} <span class="text-blue-600 dark:text-blue-400">支持率: {{ selectedParty.support_rate }}%</span>
              </p>
              <div class="flex justify-center space-x-4 text-sm">
                <p class="rounded bg-yellow-100 px-2 py-1 dark:bg-yellow-900/50 dark:text-yellow-100">胜利难度: <span class="font-medium">{{ selectedParty.difficulty }}</span></p>
                <p class="rounded bg-green-100 px-2 py-1 dark:bg-green-900/50 dark:text-green-100">胜场数: <span class="font-medium">{{ selectedParty.win_count }}</span></p>
              </div>
            </div>

            <select
              v-model="candidateParty"
              @change="updatePartySelection"
              class="w-full rounded-md border bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              required
            >
              <option value="">选择党派</option>
              <option v-for="party in parties" :key="party.id" :value="party.name">{{ party.name }}</option>
            </select>
          </div>

          <input
            v-model="candidateName"
            type="text"
            placeholder="候选人姓名"
            class="w-full rounded-md border bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
          />

          <button
            @click="startDebate"
            :disabled="!candidateParty || !candidateName || preparing"
            class="w-full rounded-md bg-blue-700 py-2 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="preparing">准备中...</span>
            <span v-else>开始辩论</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="debateStarted" class="fixed inset-0 flex items-center justify-center bg-white p-0 sm:p-4 dark:bg-neutral-900">
      <div class="flex h-full w-full max-w-4xl flex-col border border-gray-300 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div class="w-full bg-gray-300 text-center shadow-lg dark:bg-neutral-800">
          <div class="flex items-center justify-between bg-gray-200 p-2 dark:bg-neutral-700">
            <div class="flex w-1/2 flex-col items-center">
              <div class="w-full bg-blue-600 py-1 text-sm text-white">{{ candidateParty }}</div>
              <div class="w-full bg-blue-600 py-1 text-white">{{ candidateName }} {{ getCurrentSupportRate('candidate') }}%</div>
            </div>
            <div class="flex w-1/2 flex-col items-center">
              <div class="w-full bg-red-600 py-1 text-sm text-white">{{ opponentParty }}</div>
              <div class="w-full bg-red-600 py-1 text-white">{{ opponentName }} {{ getCurrentSupportRate('opponent') }}%</div>
            </div>
          </div>
        </div>

        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4">
          <template v-for="(topic, topicIndex) in topics" :key="topicIndex">
            <div v-if="topic.status" class="mb-4">
              <div class="mb-3 flex items-center justify-center text-xl text-neutral-800 dark:text-neutral-100">
                <span class="mr-3 flex-grow border-t border-dashed border-gray-300 dark:border-neutral-700"></span>
                {{ topic.topicName }} ({{ topicIndex + 1 }}/{{ topics.length }})
                <span class="ml-3 flex-grow border-t border-dashed border-gray-300 dark:border-neutral-700"></span>
              </div>

              <template v-for="(message, index) in topic.messages" :key="index">
                <div v-if="message.role === 'candidate'" class="mb-4 flex justify-end">
                  <div class="max-w-[80%] break-words rounded-lg bg-yellow-200 px-4 py-2 shadow dark:bg-yellow-700 dark:text-yellow-50">
                    <strong>{{ message.name }}</strong>: {{ message.content }}
                  </div>
                </div>
                <div v-else-if="message.role === 'opponent'" class="mb-4 flex justify-start">
                  <div class="max-w-[80%] break-words rounded-lg bg-red-100 px-4 py-2 text-red-800 shadow dark:bg-red-900/70 dark:text-red-100">
                    <strong>{{ message.name }}</strong>: {{ message.content }}
                  </div>
                </div>
                <div v-else-if="message.role === 'moderator'" class="mb-4 flex justify-center">
                  <div class="max-w-[80%] break-words rounded-lg bg-gray-100 px-4 py-2 text-yellow-800 shadow dark:bg-neutral-800 dark:text-yellow-200">
                    <strong>主持人</strong>: {{ message.content }}
                  </div>
                </div>
                <div v-else-if="message.role === 'media'" class="mb-4 flex justify-center">
                  <div class="max-w-[80%] break-words rounded-lg bg-blue-100 px-4 py-2 text-blue-800 shadow dark:bg-blue-900/60 dark:text-blue-100">
                    <strong>媒体</strong>: {{ message.content }}
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>

        <div class="w-full border-t border-gray-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
          <div v-if="isMyTurn" class="flex items-end rounded-[23px] bg-gray-200 p-[5px] shadow-md dark:bg-neutral-800">
            <button @click="optimizeSpeech" class="group flex min-h-[38px] min-w-[38px] items-center justify-center">
              <svg class="h-6 w-6 text-gray-500 transition-colors group-hover:text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.898.855a.4.4 0 0 0-.795 0c-.123 1.064-.44 1.802-.943 2.305-.503.503-1.241.82-2.306.943a.4.4 0 0 0 .001.794c1.047.119 1.801.436 2.317.942.512.504.836 1.241.93 2.296a.4.4 0 0 0 .796 0c.09-1.038.413-1.792.93-2.308.515-.516 1.269-.839 2.306-.928a.4.4 0 0 0 .001-.797c-1.055-.094-1.792-.418-2.296-.93-.506-.516-.823-1.27-.941-2.317Z" />
              </svg>
            </button>

            <textarea
              ref="messageInput"
              v-model="newMessage"
              rows="1"
              placeholder="等待您的发言"
              @input="autoResize"
              @keydown.enter.prevent="speak"
              class="max-h-[160px] min-h-[36px] flex-1 resize-none overflow-auto border-none bg-gray-200 p-2 focus:outline-none dark:bg-neutral-800 dark:text-neutral-100"
            />

            <button
              @click="speak"
              :disabled="!newMessage.trim()"
              :class="['ml-3 mr-2 flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full', newMessage.trim() ? 'bg-black cursor-pointer' : 'bg-gray-400 cursor-not-allowed']"
            >
              <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                <path fill="white" fill-rule="evenodd" d="M15.192 8.906a1.143 1.143 0 0 1 1.616 0l5.143 5.143a1.143 1.143 0 0 1-1.616 1.616l-3.192-3.192v9.813a1.143 1.143 0 0 1-2.286 0v-9.813l-3.192 3.192a1.143 1.143 0 1 1-1.616-1.616z" />
              </svg>
            </button>
          </div>

          <div v-else-if="aiThinking" class="flex items-center justify-center rounded-[23px] bg-gray-200 p-5 shadow-md dark:bg-neutral-800">
            <div class="inline-flex items-center">
              <span class="mr-[5px] inline-block h-2 w-2 animate-bounce rounded-full bg-[#606060] [animation-delay:0ms]" />
              <span class="mr-[5px] inline-block h-2 w-2 animate-bounce rounded-full bg-[#606060] [animation-delay:200ms]" />
              <span class="inline-block h-2 w-2 animate-bounce rounded-full bg-[#606060] [animation-delay:400ms]" />
            </div>
          </div>

          <div v-else-if="debateEnded" class="flex items-center justify-center rounded-[23px] p-[5px] shadow-md" :class="won ? 'bg-green-700' : 'bg-gray-700'">
            <button @click="showResults = true" class="min-h-[36px] leading-[36px] text-white">
              {{ won ? '打开就职演讲' : '查看失败原因' }}
            </button>
          </div>

          <div v-else class="flex items-center justify-center rounded-[23px] bg-gray-200 p-[5px] shadow-md dark:bg-neutral-800">
            <span class="min-h-[36px] leading-[36px] text-gray-500 dark:text-neutral-400">等待他人发言</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showResults" class="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
      <div class="relative w-full max-w-md rounded-lg border border-gray-300 bg-white p-6 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
        <button @click="closeResults" class="absolute right-2 top-2 text-gray-600 hover:text-gray-800 dark:text-neutral-300 dark:hover:text-neutral-100">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <template v-if="won">
          <p class="mb-2 text-center text-gray-700 dark:text-neutral-300">最终支持率: {{ getCurrentSupportRate('candidate') }}%</p>
          <h2 class="mb-4 text-center text-2xl font-semibold text-green-700 dark:text-green-400">恭喜你赢得选举！</h2>
          <p class="mb-4 text-center text-gray-700 dark:text-neutral-300">这是你的就职演讲：</p>
          <div class="max-h-80 overflow-y-auto border-y border-gray-200 py-4 dark:border-neutral-700">
            <div class="whitespace-pre-wrap px-4 text-gray-700 dark:text-neutral-200" v-html="victorySpeech"></div>
          </div>
          <button @click="resetGame" class="mt-4 w-full rounded-md bg-green-700 py-2 text-white hover:bg-green-800">再次挑战</button>
        </template>

        <template v-else>
          <p class="mb-2 text-center text-gray-700 dark:text-neutral-300">最终支持率: {{ getCurrentSupportRate('candidate') }}%</p>
          <h2 class="mb-4 text-center text-2xl font-semibold text-red-700 dark:text-red-400">很遗憾，未能胜出。</h2>
          <p class="mb-4 text-center text-gray-700 dark:text-neutral-300">失败原因分析：</p>
          <div class="max-h-80 overflow-y-auto border-y border-gray-200 py-4 dark:border-neutral-700">
            <div class="whitespace-pre-wrap px-4 text-gray-700 dark:text-neutral-200" v-html="failureReason"></div>
          </div>
          <button @click="resetGame" class="mt-4 w-full rounded-md bg-red-700 py-2 text-white hover:bg-red-800">再试一次</button>
        </template>
      </div>
    </div>

    <div v-if="preparing" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div class="rounded-lg bg-white p-6 shadow-lg dark:bg-neutral-800">
        <div class="flex items-center space-x-3">
          <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <span class="text-lg dark:text-neutral-100">准备辩论中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/debate';
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
const victorySpeech = ref('');
const failureReason = ref('');
const chatContainer = ref(null);
const messageInput = ref(null);

onMounted(() => {
  debateId.value = generateDebateId(16);
  loadParties();
});

const request = async (url, body = {}) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const loadParties = async () => {
  try {
    parties.value = await request(`${API_BASE}/parties`, { lang: 'zh' });
  } catch (error) {
    console.error('加载政党失败:', error);
  }
};

const updatePartySelection = () => {
  selectedParty.value = parties.value.find((p) => p.name === candidateParty.value) || null;
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

    topics.value[0].messages.push({ role: 'moderator', name: '主持人', content: data.prologue || '' });
    await saveMessage('moderator', '主持人', data.prologue || '');
    debateStarted.value = true;
    preparing.value = false;
    await scrollToBottom();
    startDebateLoop();
  } catch (error) {
    console.error('开始辩论失败:', error);
    preparing.value = false;
  }
};

const startDebateLoop = async () => {
  while (true) {
    const topicInfo = getTopicInfo();
    try {
      const data = await request(`${API_BASE}/debate`, { topicInfo });
      if (data.action === 'candidate') {
        isMyTurn.value = true;
        break;
      } else if (data.action === 'opponent') {
        addMessage('opponent', opponentName.value, data.content);
        await saveMessage('opponent', opponentName.value, data.content);
      } else if (data.action === 'moderator') {
        addMessage('moderator', '主持人', data.content);
        await saveMessage('moderator', '主持人', data.content);
      } else if (data.action === 'next') {
        await summaryCurrentTopic();
        break;
      } else {
        break;
      }
      await scrollToBottom();
    } catch (error) {
      console.error('辩论循环错误:', error);
      break;
    }
  }
};

const speak = async () => {
  if (!newMessage.value.trim()) return;
  isMyTurn.value = false;
  const message = newMessage.value.trim();
  addMessage('candidate', candidateName.value, message);
  await saveMessage('candidate', candidateName.value, '', message);
  newMessage.value = '';
  await scrollToBottom();
  startDebateLoop();
};

const optimizeSpeech = async () => {
  if (!newMessage.value.trim()) return;
  aiThinking.value = true;
  try {
    const data = await request(`${API_BASE}/optimize`, {
      topicInfo: getTopicInfo(),
      party: candidateParty.value,
      name: candidateName.value,
      draft: newMessage.value
    });
    newMessage.value = data.content || '';
    await autoResize();
  } catch (error) {
    console.error('优化发言失败:', error);
  }
  aiThinking.value = false;
};

const summaryCurrentTopic = async () => {
  try {
    const data = await request(`${API_BASE}/summary`, { topicInfo: getTopicInfo() });
    addMessage('media', '媒体', data.summary || '');
    await saveMessage('media', '媒体', data.summary || '');
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
    console.error('议题总结失败:', error);
  }
};

const continueToNextTopic = async () => {
  const prevTopic = topics.value[currentTopic.value - 1].topicName;
  const newTopic = topics.value[currentTopic.value].topicName;
  const candidateInfo = `候选人：${candidateParty.value} - ${candidateName.value}，支持率：${topics.value[currentTopic.value].candidateSupportRate}%\n对手：${opponentParty.value} - ${opponentName.value}，支持率：${topics.value[currentTopic.value].opponentSupportRate}%`;
  try {
    const data = await request(`${API_BASE}/continue`, { prevTopic, newTopic, candidateInfo });
    topics.value[currentTopic.value].status = true;
    topics.value[currentTopic.value].messages.push({ role: 'moderator', name: '主持人', content: data.content || '' });
    currentTopic.value++;
    await scrollToBottom();
    startDebateLoop();
  } catch (error) {
    console.error('继续下一议题失败:', error);
  }
};

const finishDebate = async () => {
  const idx = currentTopic.value - 1;
  const finalSupportRate = Number(topics.value[idx].candidateSupportRate || 0);
  const policy = topics.value.map((topic) => `议题: ${topic.topicName} - 主张: ${topic.candidatePolicy} - 支持率: ${topic.candidateSupportRate}% - 对手支持率: ${topic.opponentSupportRate}%`).join('\n');
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
    console.error('结束辩论失败:', error);
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
  const currentCandidateInfo = `${candidateParty.value} - ${candidateName.value}，党派主张：${selectedParty.value?.policy}，当前支持率：${topics.value[idx].candidateSupportRate}%`;
  const opponentInfo = `${opponentParty.value} - ${opponentName.value}，当前支持率：${topics.value[idx].opponentSupportRate}%`;
  const candidateInfo = `当前候选人信息:\n${currentCandidateInfo}\n对手候选人信息:\n${opponentInfo}\n\n`;
  const topicInfo = `议题:\n${topics.value[idx].topicName}\n\n`;
  const messages = topics.value[idx].messages;
  const latest = messages.length > 0 ? messages[messages.length - 1] : null;
  const latestInfo = latest ? `最新的发言:\n${latest.name}: ${latest.content}\n` : '';
  const recent = messages.slice(0, -1).map((m, i) => `${i + 1}. ${m.name}: ${m.content}`).join('\n');
  return `${candidateInfo}${topicInfo}最近的发言:\n${recent}\n\n${latestInfo}`;
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
  victorySpeech.value = '';
  failureReason.value = '';
  candidateName.value = '';
  candidateParty.value = '';
  selectedParty.value = null;
  debateId.value = generateDebateId(16);
};
</script>
