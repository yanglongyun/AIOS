<template>
  <div class="fortune-root">
    <div class="fortune-scroll">
      <div class="fortune-body">

        <!-- 标题 -->
        <div class="header">
          <h1 class="header-title">算 一 卦</h1>
          <p class="header-sub">诚心正意 · 六爻问天</p>
        </div>

        <!-- 卦象区 -->
        <div class="hex-area">
          <!-- 卦名 -->
          <div v-if="hexagramName" class="hex-name">{{ hexagramName }}</div>
          <div v-if="result && result.signName" class="hex-sign">{{ result.signName }}</div>

          <!-- 六爻线 (从下到上: 初爻→上爻) -->
          <div class="yao-stack" v-if="displayYaos.some(y => y !== null)">
            <div v-for="(yao, i) in displayYaos" :key="i" class="yao-row"
              :style="{ opacity: yao !== null ? 1 : 0, transform: yao !== null ? 'none' : 'translateY(6px)' }">
              <span class="yao-label">{{ yaoLabels[i] }}</span>
              <div v-if="yao === 1" class="yao-yang"><div></div></div>
              <div v-else-if="yao === 0" class="yao-yin"><div></div><div></div></div>
              <div v-else class="yao-empty"></div>
              <span class="yao-coins">
                <span v-for="(c, j) in (coins[i] || [])" :key="j" class="coin" :class="c ? 'yang' : 'yin'">{{ c ? '字' : '背' }}</span>
              </span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!shaking && !hexagramName && !result" class="hex-empty">
            <div class="hex-empty-icon">☰</div>
            <div>心中默念所问之事，起卦求解</div>
          </div>
        </div>

        <!-- 输入 -->
        <div class="input-area">
          <textarea v-model="question" rows="2" placeholder="心中所惑，落笔此处..." :disabled="shaking || loading"></textarea>
          <button class="divine-btn" @click="divine" :disabled="shaking || loading || !question.trim()">
            {{ shaking ? '摇卦中...' : loading ? '解卦中...' : '起 卦' }}
          </button>
        </div>

        <!-- 结果卡片 - 竹简卷轴 -->
        <div v-if="result" class="scroll-card">
          <div class="scroll-sign">{{ result.signName }}</div>
          <div class="scroll-poem" v-html="formatPoem(result.signPoem)"></div>
          <div class="scroll-divider"></div>
          <div class="scroll-yj">
            <div class="scroll-yj-item">
              <div class="scroll-yj-label good">宜</div>
              <div class="scroll-yj-text">{{ result.good }}</div>
            </div>
            <div class="scroll-yj-item">
              <div class="scroll-yj-label bad">忌</div>
              <div class="scroll-yj-text">{{ result.bad }}</div>
            </div>
          </div>
          <div class="scroll-advice">{{ result.advice }}</div>
        </div>

        <!-- 历史 -->
        <div v-if="history.length" class="history-section">
          <div class="history-title">历 史 卦 象</div>
          <div v-for="item in history" :key="item.id" class="history-item">
            <div class="history-top">
              <span class="history-hex">{{ item.hexagram || '' }}</span>
              <span class="history-sign">{{ item.signName }}</span>
              <span class="history-time">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="history-q">{{ item.question }}</div>
            <div class="history-poem">"{{ item.signPoem }}"</div>
          </div>
        </div>
        <div v-else-if="!result" class="empty-hint">尚无卦象记录</div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

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
const yaoLabels = ['上', '五', '四', '三', '二', '初'];

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
  const yaoDesc = allYaos.map((y, i) => `${['初','二','三','四','五','上'][i]}爻:${y ? '阳' : '阴'}`).join('，');

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
.fortune-root {
  height: 100%;
  background: #e8ddd0;
  font-family: 'PingFang SC', serif;
  color: #3a2e20;
}
.fortune-scroll {
  height: 100%;
  overflow-y: auto;
}
.fortune-body {
  max-width: 460px;
  margin: 0 auto;
  padding: 28px 20px 60px;
}

/* ── 标题 ── */
.header {
  text-align: center;
  margin-bottom: 28px;
}
.header-title {
  font-size: 28px;
  font-weight: 900;
  font-family: serif;
  letter-spacing: .15em;
  color: #5a4020;
}
.header-sub {
  font-size: 12px;
  color: #a09070;
  margin-top: 4px;
  letter-spacing: .2em;
}

/* ── 卦象区 ── */
.hex-area {
  background:
    repeating-linear-gradient(90deg,
      rgba(160,120,60,.06) 0px, rgba(160,120,60,.06) 1px,
      transparent 1px, transparent 28px
    ),
    linear-gradient(180deg, #f0e4d0, #e8dcc4);
  border: 2px solid #c8a868;
  border-radius: 4px;
  padding: 24px 20px;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
}
/* 卷轴边缘 */
.hex-area::before,
.hex-area::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  height: 10px;
  pointer-events: none;
}
.hex-area::before {
  top: 0;
  background: linear-gradient(180deg, rgba(200,168,96,.25), transparent);
  border-radius: 4px 4px 0 0;
}
.hex-area::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(200,168,96,.25), transparent);
  border-radius: 0 0 4px 4px;
}

.hex-name {
  text-align: center;
  font-size: 20px;
  font-weight: 900;
  font-family: serif;
  color: #5a4020;
  letter-spacing: .15em;
  margin-bottom: 4px;
}
.hex-sign {
  text-align: center;
  font-size: 13px;
  color: #8a6a30;
  margin-bottom: 14px;
  letter-spacing: .1em;
}

/* 六爻 */
.yao-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
.yao-row {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all .4s ease;
}
.yao-label {
  width: 16px;
  font-size: 11px;
  color: #a09070;
  text-align: right;
  font-family: serif;
}
.yao-yang > div {
  width: 100px;
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(180deg, #8a5c28, #6a4420);
  box-shadow: 0 1px 3px rgba(0,0,0,.15);
}
.yao-yin {
  display: flex;
  gap: 14px;
}
.yao-yin > div {
  width: 43px;
  height: 10px;
  border-radius: 2px;
  background: linear-gradient(180deg, #8a5c28, #6a4420);
  box-shadow: 0 1px 3px rgba(0,0,0,.15);
}
.yao-empty {
  width: 100px;
  height: 10px;
}
.yao-coins {
  display: flex;
  gap: 3px;
}
.coin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 8px;
  font-weight: 700;
  border: 1.5px solid #b09050;
}
.coin.yang {
  background: #d4b870;
  color: #5a4020;
}
.coin.yin {
  background: #f0e4d0;
  color: #8a7a58;
}

.hex-empty {
  text-align: center;
  padding: 28px 0;
  color: #b0a080;
  font-size: 13px;
}
.hex-empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
  opacity: .35;
}

/* ── 输入 ── */
.input-area {
  background: rgba(255,255,255,.4);
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
}
.input-area textarea {
  width: 100%;
  border: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  color: #3a2e20;
  outline: none;
  font-family: inherit;
}
.input-area textarea::placeholder { color: #b0a080; }
.input-area textarea:disabled { opacity: .5; }
.divine-btn {
  width: 100%;
  margin-top: 10px;
  padding: 11px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #c8a060, #a07830);
  color: #fff8ee;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: serif;
  letter-spacing: .15em;
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
  transition: opacity .2s;
}
.divine-btn:hover:not(:disabled) { opacity: .9; }
.divine-btn:disabled { opacity: .45; cursor: default; }

/* ── 结果卡片 - 竹简 ── */
.scroll-card {
  background:
    repeating-linear-gradient(90deg,
      rgba(160,120,60,.06) 0px, rgba(160,120,60,.06) 1px,
      transparent 1px, transparent 28px
    ),
    linear-gradient(180deg, #f0e4d0, #e8dcc4);
  border: 2px solid #c8a868;
  border-radius: 4px;
  padding: 24px 20px;
  margin-bottom: 20px;
  position: relative;
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
}
.scroll-card::before,
.scroll-card::after {
  content: '';
  position: absolute;
  left: 0; right: 0;
  height: 10px;
  pointer-events: none;
}
.scroll-card::before {
  top: 0;
  background: linear-gradient(180deg, rgba(200,168,96,.25), transparent);
  border-radius: 4px 4px 0 0;
}
.scroll-card::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(200,168,96,.25), transparent);
  border-radius: 0 0 4px 4px;
}
.scroll-sign {
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  font-family: serif;
  color: #8a5c28;
  letter-spacing: .1em;
}
.scroll-poem {
  text-align: center;
  font-size: 13px;
  color: #8a7a58;
  margin-top: 10px;
  line-height: 2;
  font-style: italic;
}
.scroll-divider {
  width: 60px;
  height: 1px;
  background: #c8a868;
  margin: 16px auto;
}
.scroll-yj {
  display: flex;
  justify-content: center;
  gap: 48px;
}
.scroll-yj-item { text-align: center; }
.scroll-yj-label {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .1em;
  font-family: serif;
}
.scroll-yj-label.good { color: #6a9a50; }
.scroll-yj-label.bad { color: #b05040; }
.scroll-yj-text {
  font-size: 12px;
  color: #5a4a30;
  margin-top: 4px;
}
.scroll-advice {
  margin-top: 16px;
  font-size: 13px;
  line-height: 2;
  color: #7a6a48;
  text-align: center;
  padding: 0 8px;
}

/* ── 历史 ── */
.history-section { margin-top: 4px; }
.history-title {
  font-size: 11px;
  font-weight: 700;
  color: #a09070;
  letter-spacing: .15em;
  margin-bottom: 10px;
}
.history-item {
  background: rgba(255,255,255,.4);
  border: 1px solid rgba(0,0,0,.04);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 6px;
}
.history-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.history-hex {
  font-size: 12px;
  font-weight: 700;
  color: #5a4020;
  font-family: serif;
}
.history-sign {
  font-size: 12px;
  color: #8a6a30;
}
.history-time {
  font-size: 10px;
  color: #b0a088;
  margin-left: auto;
}
.history-q {
  font-size: 12px;
  color: #7a6a48;
  margin-top: 4px;
}
.history-poem {
  font-size: 11px;
  color: #a09070;
  margin-top: 2px;
  font-style: italic;
}
.empty-hint {
  padding: 32px 0;
  text-align: center;
  font-size: 13px;
  color: #b0a080;
}
</style>
