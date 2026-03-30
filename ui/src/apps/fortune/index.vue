<template>
  <div class="h-full bg-[#e8ddd0] font-['PingFang_SC',serif] text-[#3a2e20]">
    <div class="h-full overflow-y-auto">
      <div class="mx-auto max-w-[460px] px-5 pb-[60px] pt-7">
        <div class="mb-7 text-center">
          <h1 class="font-serif text-[28px] font-black tracking-[0.15em] text-[#5a4020]">__T_FORTUNE_TITLE__</h1>
          <p class="mt-1 text-xs tracking-[0.2em] text-[#a09070]">__T_FORTUNE_SUBTITLE__</p>
        </div>

        <FortuneHexagramPanel
          :hexagram-name="hexagramName"
          :result="result"
          :display-yaos="displayYaos"
          :yao-labels="yaoLabels"
          :coins="coins"
          :shaking="shaking"
        />

        <FortuneQuestionForm
          v-model:question="question"
          :shaking="shaking"
          :loading="loading"
          @divine="divine"
        />

        <FortuneResultCard :result="result" :format-poem="formatPoem" />
        <FortuneHistoryList :history="history" :result="result" :format-time="formatTime" />

        <div class="mt-10 border-t border-dashed border-[rgba(160,140,110,0.3)] pt-5 text-center">
          <p class="font-['PingFang_SC',sans-serif] text-[11px] leading-[1.8] tracking-[0.05em] text-[#a09070] opacity-80">
            __T_FORTUNE_DISCLAIMER_1__<br>__T_FORTUNE_DISCLAIMER_2__
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';
import FortuneHexagramPanel from './FortuneHexagramPanel.vue';
import FortuneQuestionForm from './FortuneQuestionForm.vue';
import FortuneResultCard from './FortuneResultCard.vue';
import FortuneHistoryList from './FortuneHistoryList.vue';

const HEXAGRAM_TABLE = [
  ['坤为地', '地山谦', '地水师', '地风升', '地雷复', '地火明夷', '地泽临', '地天泰'],
  ['山地剥', '艮为山', '山水蒙', '山风蛊', '山雷颐', '山火贲', '山泽损', '山天大畜'],
  ['水地比', '水山蹇', '坎为水', '水风井', '水雷屯', '水火既济', '水泽节', '水天需'],
  ['风地观', '风山渐', '风水涣', '巽为风', '风雷益', '风火家人', '风泽中孚', '风天小畜'],
  ['雷地豫', '雷山小过', '雷水解', '雷风恒', '震为雷', '雷火丰', '雷泽归妹', '雷天大壮'],
  ['火地晋', '火山旅', '火水未济', '火风鼎', '火雷噬嗑', '离为火', '火泽睽', '火天大有'],
  ['泽地萃', '泽山咸', '泽水困', '泽风大过', '泽雷随', '泽火革', '兑为泽', '泽天夬'],
  ['天地否', '天山遁', '天水讼', '天风姤', '天雷无妄', '天火同人', '天泽履', '乾为天']
];

const yaoLabels = computed(() => [
  '__T_FORTUNE_YAO_TOP__',
  '__T_FORTUNE_YAO_FIVE__',
  '__T_FORTUNE_YAO_FOUR__',
  '__T_FORTUNE_YAO_THREE__',
  '__T_FORTUNE_YAO_TWO__',
  '__T_FORTUNE_YAO_ONE__'
]);

const trigramIndex = (y0, y1, y2) => y0 * 4 + y1 * 2 + y2;

const lookupHexagram = (yaos) => {
  const lower = trigramIndex(yaos[0], yaos[1], yaos[2]);
  const upper = trigramIndex(yaos[3], yaos[4], yaos[5]);
  return HEXAGRAM_TABLE[upper][lower];
};

const question = ref('');
const shaking = ref(false);
const loading = ref(false);
const result = ref(null);
const history = ref([]);
const hexagramName = ref('');
const displayYaos = ref([null, null, null, null, null, null]);
const coins = ref([[], [], [], [], [], []]);

const request = async (url, opts) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
};

const formatTime = (v) => {
  if (!v) return '';
  return v.replace('T', ' ').slice(5, 16);
};

const formatPoem = (poem) => {
  if (!poem) return '';
  return poem.replace(/[，。；,;]/g, (m) => `${m}<br>`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shakeOnce = () => {
  const c = [Math.random() < 0.5 ? 1 : 0, Math.random() < 0.5 ? 1 : 0, Math.random() < 0.5 ? 1 : 0];
  const sum = c.reduce((s, v) => s + (v ? 2 : 3), 0);
  const isYang = sum === 7 || sum === 9 ? 1 : 0;
  return { coins: c, yao: isYang };
};

const divine = async () => {
  if (!question.value.trim() || shaking.value || loading.value) return;

  result.value = null;
  hexagramName.value = '';
  displayYaos.value = [null, null, null, null, null, null];
  coins.value = [[], [], [], [], [], []];
  shaking.value = true;

  const allYaos = [];
  for (let i = 0; i < 6; i += 1) {
    const { coins: c, yao } = shakeOnce();
    allYaos.push(yao);

    const displayIdx = 5 - i;
    coins.value[displayIdx] = c;
    displayYaos.value[displayIdx] = yao;

    await sleep(500);
  }

  const name = lookupHexagram(allYaos);
  hexagramName.value = name;
  shaking.value = false;

  loading.value = true;
  const lang = LOCALE;
  const yaoDesc = lang === 'en'
    ? allYaos.map((y, i) => `${['1st', '2nd', '3rd', '4th', '5th', 'top'][i]}:${y ? 'yang' : 'yin'}`).join(', ')
    : allYaos.map((y, i) => `${['初', '二', '三', '四', '五', '上'][i]}爻:${y ? '阳' : '阴'}`).join('，');
  const prompt = lang === 'en'
    ? 'Interpret the given hexagram and return JSON by schema.'
    : '请根据给定卦象完成解卦，按 schema 输出 JSON。';
  const systemText = lang === 'en'
    ? `You are a skilled I Ching diviner with elegant writing.
The user has already generated a specific hexagram. Interpret strictly based on this hexagram.

Requirements:
1. signName: overall rating (e.g. Great Fortune / Moderate / Caution)
2. signPoem: an original four-line poem with classical tone
3. good: 2-3 recommended actions, comma-separated
4. bad: 2-3 discouraged actions, comma-separated
5. advice: 80-120 words, practical and grounded, avoid absolute claims, keep entertainment disclaimer tone

Hexagram to interpret: "${name}".

Return JSON only:
{"signName":"...","signPoem":"...","good":"...","bad":"...","advice":"..."}`
    : `你是一位精通周易六爻的卦师，学识渊博、文笔古雅。
用户通过摇铜钱起卦，已经得到了具体的卦象。请基于此卦象为用户解卦。

要求：
1. signName：给出卦象评价（如"大吉"、"中吉"、"小吉"、"中平"、"小凶"、"大凶"）
2. signPoem：写一首原创四句七言签诗，有古韵，切合卦象与问题
3. good：宜做之事（2-3项，逗号分隔）
4. bad：忌做之事（2-3项，逗号分隔）
5. advice：结合卦象和问题给出解读建议（80-120字，有易经味道但通俗实用）。请务必注意言辞不要过于绝对，可适当带入"尽人事，听天命"或"科学理性看待、仅供娱乐参考"的寓意，告诉用户算卦不要太当真。

注意：解读必须紧扣所得卦象"${name}"的卦义，不可随意发挥。

必须返回 JSON：
{"signName":"评价","signPoem":"签诗","good":"宜","bad":"忌","advice":"建议"}`;
  const userText = lang === 'en'
    ? `My question: ${question.value.trim()}\nHexagram: ${name}\nLines (bottom to top): ${yaoDesc}`
    : `我的问题：${question.value.trim()}\n所得卦象：${name}\n爻象（初爻到上爻）：${yaoDesc}`;
  const data = await request('/aios/apps/fortune/divine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question.value.trim(),
      hexagram: name,
      taskTitle: lang === 'en' ? 'I Ching Reading' : '周易解卦',
      prompt,
      messages: [
        { role: 'system', content: systemText },
        { role: 'user', content: userText }
      ]
    })
  });
  loading.value = false;

  if (data.success) {
    result.value = data.item;
    history.value.unshift(data.item);
    question.value = '';
  }
};

const loadHistory = async () => {
  const data = await request('/aios/apps/fortune/list?page=1&pageSize=30');
  if (data.success) history.value = data.items;
};

onMounted(() => {
  loadHistory();
  chatPanel.setContext({ scene: 'fortune', label: '__T_APP_SIDEBAR_FORTUNE__' });
  chatPanel.setQuickMessages(['__T_FORTUNE_CHAT_QUICK_1__', '__T_FORTUNE_CHAT_QUICK_2__', '__T_FORTUNE_CHAT_QUICK_3__']);
});
onUnmounted(() => { chatPanel.clearContext(); chatPanel.setQuickMessages([]); });
</script>
