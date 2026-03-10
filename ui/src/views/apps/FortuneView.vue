<template>
  <div class="h-full bg-[#e8ddd0] font-['PingFang_SC',serif] text-[#3a2e20]">
    <div class="h-full overflow-y-auto">
      <div class="mx-auto max-w-[460px] px-5 pb-[60px] pt-7">
        <div class="mb-7 text-center">
          <h1 class="font-serif text-[28px] font-black tracking-[0.15em] text-[#5a4020]">{{ t('fortune_title') }}</h1>
          <p class="mt-1 text-xs tracking-[0.2em] text-[#a09070]">{{ t('fortune_subtitle') }}</p>
        </div>

        <div class="hex-area mb-5 rounded border-2 border-[#c8a868] px-5 py-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <div v-if="hexagramName" class="mb-1 text-center font-serif text-xl font-black tracking-[0.15em] text-[#5a4020]">{{ hexagramName }}</div>
          <div v-if="result && result.signName" class="mb-3.5 text-center text-[13px] tracking-[0.1em] text-[#8a6a30]">{{ result.signName }}</div>

          <div v-if="displayYaos.some(y => y !== null)" class="flex flex-col items-center gap-2 py-2">
            <div
              v-for="(yao, i) in displayYaos"
              :key="i"
              class="flex items-center gap-2.5 transition-all duration-300"
              :style="{ opacity: yao !== null ? 1 : 0, transform: yao !== null ? 'none' : 'translateY(6px)' }"
            >
              <span class="w-4 text-right font-serif text-[11px] text-[#a09070]">{{ yaoLabels[i] }}</span>
              <div v-if="yao === 1">
                <div class="h-2.5 w-[100px] rounded-[2px] bg-[linear-gradient(180deg,#8a5c28,#6a4420)] shadow-[0_1px_3px_rgba(0,0,0,.15)]"></div>
              </div>
              <div v-else-if="yao === 0" class="flex gap-3.5">
                <div class="h-2.5 w-[43px] rounded-[2px] bg-[linear-gradient(180deg,#8a5c28,#6a4420)] shadow-[0_1px_3px_rgba(0,0,0,.15)]"></div>
                <div class="h-2.5 w-[43px] rounded-[2px] bg-[linear-gradient(180deg,#8a5c28,#6a4420)] shadow-[0_1px_3px_rgba(0,0,0,.15)]"></div>
              </div>
              <div v-else class="h-2.5 w-[100px]"></div>
              <span class="flex gap-[3px]">
                <span
                  v-for="(c, j) in (coins[i] || [])"
                  :key="j"
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-[#b09050] text-[8px] font-bold"
                  :class="c ? 'bg-[#d4b870] text-[#5a4020]' : 'bg-[#f0e4d0] text-[#8a7a58]'"
                >
                  {{ c ? t('fortune_coin_char') : t('fortune_coin_back') }}
                </span>
              </span>
            </div>
          </div>

          <div v-if="!shaking && !hexagramName && !result" class="py-7 text-center text-[13px] text-[#b0a080]">
            <div class="mb-2 text-4xl opacity-35">☰</div>
            <div>{{ t('fortune_empty_prompt') }}</div>
          </div>
        </div>

        <div class="mb-5 rounded-[10px] border border-black/[.06] bg-white/40 p-3.5">
          <textarea
            v-model="question"
            rows="2"
            :placeholder="t('fortune_input_placeholder')"
            :disabled="shaking || loading"
            class="w-full resize-none border-none bg-transparent text-sm leading-[1.6] text-[#3a2e20] outline-none placeholder:text-[#b0a080] disabled:opacity-50"
          ></textarea>
          <button
            class="mt-2.5 w-full rounded-lg bg-[linear-gradient(135deg,#c8a060,#a07830)] px-3 py-[11px] font-serif text-sm font-bold tracking-[0.15em] text-[#fff8ee] shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-45"
            @click="divine"
            :disabled="shaking || loading || !question.trim()"
          >
            {{ shaking ? t('fortune_shaking') : loading ? t('fortune_reading') : t('fortune_divine') }}
          </button>
        </div>

        <div v-if="result" class="scroll-card mb-5 rounded border-2 border-[#c8a868] px-5 py-6 shadow-[0_4px_16px_rgba(0,0,0,.08)]">
          <div class="text-center font-serif text-[28px] font-black tracking-[0.1em] text-[#8a5c28]">{{ result.signName }}</div>
          <div class="mt-2.5 text-center text-[13px] italic leading-8 text-[#8a7a58]" v-html="formatPoem(result.signPoem)"></div>
          <div class="mx-auto my-4 h-px w-[60px] bg-[#c8a868]"></div>
          <div class="flex justify-center gap-12">
            <div class="text-center">
              <div class="font-serif text-[13px] font-extrabold tracking-[0.1em] text-[#6a9a50]">{{ t('fortune_good') }}</div>
              <div class="mt-1 text-xs text-[#5a4a30]">{{ result.good }}</div>
            </div>
            <div class="text-center">
              <div class="font-serif text-[13px] font-extrabold tracking-[0.1em] text-[#b05040]">{{ t('fortune_bad') }}</div>
              <div class="mt-1 text-xs text-[#5a4a30]">{{ result.bad }}</div>
            </div>
          </div>
          <div class="mt-4 px-2 text-center text-[13px] leading-8 text-[#7a6a48]">{{ result.advice }}</div>
        </div>

        <div v-if="history.length" class="mt-1">
          <div class="mb-2.5 text-[11px] font-bold tracking-[0.15em] text-[#a09070]">{{ t('fortune_history') }}</div>
          <div
            v-for="item in history"
            :key="item.id"
            class="mb-1.5 rounded-lg border border-black/[.04] bg-white/40 px-3.5 py-3"
          >
            <div class="flex items-center gap-2">
              <span class="font-serif text-xs font-bold text-[#5a4020]">{{ item.hexagram || '' }}</span>
              <span class="text-xs text-[#8a6a30]">{{ item.signName }}</span>
              <span class="ml-auto text-[10px] text-[#b0a088]">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="mt-1 text-xs text-[#7a6a48]">{{ item.question }}</div>
            <div class="mt-0.5 text-[11px] italic text-[#a09070]">"{{ item.signPoem }}"</div>
          </div>
        </div>
        <div v-else-if="!result" class="py-8 text-center text-[13px] text-[#b0a080]">{{ t('fortune_empty_history') }}</div>

        <div class="mt-10 border-t border-dashed border-[rgba(160,140,110,0.3)] pt-5 text-center">
          <p class="font-['PingFang_SC',sans-serif] text-[11px] leading-[1.8] tracking-[0.05em] text-[#a09070] opacity-80">
            {{ t('fortune_disclaimer_1') }}<br>{{ t('fortune_disclaimer_2') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useI18n } from '../../i18n/index.js';
const { t } = useI18n();
/* ── 八卦 & 六十四卦表 ── */
const TRIGRAM_NAMES = ['坤', '艮', '坎', '巽', '震', '离', '兑', '乾'];
// HEXAGRAM_TABLE[upperTrigramIndex][lowerTrigramIndex]
const HEXAGRAM_TABLE = [
  ['坤为地', '地山谦', '地水师', '地风升', '地雷复', '地火明夷', '地泽临', '地天泰'],
  ['山地剥', '艮为山', '山水蒙', '山风蛊', '山雷颐', '山火贲', '山泽损', '山天大畜'],
  ['水地比', '水山蹇', '坎为水', '水风井', '水雷屯', '水火既济', '水泽节', '水天需'],
  ['风地观', '风山渐', '风水涣', '巽为风', '风雷益', '风火家人', '风泽中孚', '风天小畜'],
  ['雷地豫', '雷山小过', '雷水解', '雷风恒', '震为雷', '雷火丰', '雷泽归妹', '雷天大壮'],
  ['火地晋', '火山旅', '火水未济', '火风鼎', '火雷噬嗑', '离为火', '火泽睽', '火天大有'],
  ['泽地萃', '泽山咸', '泽水困', '泽风大过', '泽雷随', '泽火革', '兑为泽', '泽天夬'],
  ['天地否', '天山遁', '天水讼', '天风姤', '天雷无妄', '天火同人', '天泽履', '乾为天'],
];
const yaoLabels = computed(() => [
  t('fortune_yao_top'),
  t('fortune_yao_five'),
  t('fortune_yao_four'),
  t('fortune_yao_three'),
  t('fortune_yao_two'),
  t('fortune_yao_one')
]);

const trigramIndex = (y0, y1, y2) => y0 * 4 + y1 * 2 + y2; // bottom, mid, top

const lookupHexagram = (yaos) => {
  // yaos: [初,二,三,四,五,上] = bottom to top
  const lower = trigramIndex(yaos[0], yaos[1], yaos[2]);
  const upper = trigramIndex(yaos[3], yaos[4], yaos[5]);
  return HEXAGRAM_TABLE[upper][lower];
};

/* ── 状态 ── */
const question = ref('');
const shaking = ref(false);
const loading = ref(false);
const result = ref(null);
const history = ref([]);
const hexagramName = ref('');
// displayYaos: 从上到下显示 [上爻, 五爻, 四爻, 三爻, 二爻, 初爻]
const displayYaos = ref([null, null, null, null, null, null]);
const coins = ref([[], [], [], [], [], []]);
// yaos 内部存储: [初爻, 二爻, 三爻, 四爻, 五爻, 上爻] = bottom to top
const yaosData = ref([]);

/* ── 工具函数 ── */
const request = async (url, opts) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
};

const formatTime = (t) => {
  if (!t) return '';
  return t.replace('T', ' ').slice(5, 16);
};

const formatPoem = (poem) => {
  if (!poem) return '';
  return poem.replace(/[，。；,;]/g, m => m + '<br>');
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ── 摇卦 ── */
const shakeOnce = () => {
  // 3 枚铜钱: 0=背(阳面), 1=字(阴面)
  // 值: 字=2, 背=3
  const c = [Math.random() < 0.5 ? 1 : 0, Math.random() < 0.5 ? 1 : 0, Math.random() < 0.5 ? 1 : 0];
  const sum = c.reduce((s, v) => s + (v ? 2 : 3), 0);
  // 6=老阴→阴, 7=少阳→阳, 8=少阴→阴, 9=老阳→阳
  const isYang = sum === 7 || sum === 9 ? 1 : 0;
  return { coins: c, yao: isYang };
};

const divine = async () => {
  if (!question.value.trim() || shaking.value || loading.value) return;

  // 重置
  result.value = null;
  hexagramName.value = '';
  displayYaos.value = [null, null, null, null, null, null];
  coins.value = [[], [], [], [], [], []];
  yaosData.value = [];
  shaking.value = true;

  // 生成 6 爻 (从初爻到上爻)
  const allYaos = [];
  for (let i = 0; i < 6; i++) {
    const { coins: c, yao } = shakeOnce();
    allYaos.push(yao);
    yaosData.value = [...allYaos];

    // 显示顺序是反的: displayYaos[5]=初爻, displayYaos[0]=上爻
    const displayIdx = 5 - i;
    coins.value[displayIdx] = c;
    displayYaos.value[displayIdx] = yao;

    await sleep(500);
  }

  // 查表得卦名
  const name = lookupHexagram(allYaos);
  hexagramName.value = name;
  shaking.value = false;

  // 调 API 解卦
  loading.value = true;
  const yaoDesc = allYaos.map((y, i) => `${['初', '二', '三', '四', '五', '上'][i]}爻:${y ? '阳' : '阴'}`).join('，');

  const data = await request('/apps/fortune/divine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: question.value.trim(), hexagram: name, yaos: yaoDesc })
  });
  loading.value = false;

  if (data.success) {
    result.value = data.item;
    history.value.unshift(data.item);
    question.value = '';
  }
};

/* ── 历史 ── */
const loadHistory = async () => {
  const data = await request('/apps/fortune/list?page=1&pageSize=30');
  if (data.success) history.value = data.items;
};

onMounted(loadHistory);
</script>

<style scoped>
.hex-area {
  background:
    repeating-linear-gradient(90deg,
      rgba(160, 120, 60, .06) 0px, rgba(160, 120, 60, .06) 1px,
      transparent 1px, transparent 28px),
    linear-gradient(180deg, #f0e4d0, #e8dcc4);
  border: 2px solid #c8a868;
  border-radius: 4px;
  padding: 24px 20px;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .08);
}

/* 卷轴边缘 */
.hex-area::before,
.hex-area::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 10px;
  pointer-events: none;
}

.hex-area::before {
  top: 0;
  background: linear-gradient(180deg, rgba(200, 168, 96, .25), transparent);
  border-radius: 4px 4px 0 0;
}

.hex-area::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(200, 168, 96, .25), transparent);
  border-radius: 0 0 4px 4px;
}

.scroll-card {
  background:
    repeating-linear-gradient(90deg,
      rgba(160, 120, 60, .06) 0px, rgba(160, 120, 60, .06) 1px,
      transparent 1px, transparent 28px),
    linear-gradient(180deg, #f0e4d0, #e8dcc4);
  border: 2px solid #c8a868;
  border-radius: 4px;
  padding: 24px 20px;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .08);
}

.scroll-card::before,
.scroll-card::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 10px;
  pointer-events: none;
}

.scroll-card::before {
  top: 0;
  background: linear-gradient(180deg, rgba(200, 168, 96, .25), transparent);
  border-radius: 4px 4px 0 0;
}

.scroll-card::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(200, 168, 96, .25), transparent);
  border-radius: 0 0 4px 4px;
}

</style>
