<template>
  <div class="flex h-full flex-col bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif] dark:bg-[#1a1410]">
    <!-- 顶部标题 -->
    <div class="border-b border-[#dcd0b8] bg-[#fffdf8] px-6 py-4 dark:border-[#2a1e14] dark:bg-[#221a12]">
      <h1 class="text-lg font-bold text-[#5a4a38] dark:text-[#e8d4b8]">算一卦</h1>
      <p class="mt-0.5 text-xs text-[#8a7a60] dark:text-[#6a5840]">心诚则灵，转盘问天</p>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-[480px] px-6 py-6">

        <!-- 转盘 -->
        <div class="mb-6 flex justify-center">
          <div class="relative">
            <svg width="240" height="240" viewBox="0 0 260 260" class="drop-shadow-lg">
              <circle cx="130" cy="130" r="126" fill="none" stroke="#c8a060" stroke-width="3" opacity="0.4" />
              <g :style="{ transform: `rotate(${wheelAngle}deg)`, transformOrigin: '130px 130px', transition: spinning ? 'transform 4s cubic-bezier(0.15,0.6,0.25,1)' : 'none' }">
                <path v-for="(s, i) in signs" :key="i"
                  :d="slicePath(i)" :fill="sliceColors[i % sliceColors.length]" stroke="#c8a060" stroke-width="1" />
                <text v-for="(s, i) in signs" :key="'t'+i"
                  :transform="sliceTextTransform(i)"
                  text-anchor="middle" font-size="12" :fill="i % 2 === 0 ? '#5a4a38' : '#fffdf8'" font-weight="600">{{ s }}</text>
              </g>
              <!-- 中心 -->
              <circle cx="130" cy="130" r="28" fill="#c8a060" stroke="#a08040" stroke-width="2" />
              <text x="130" y="135" text-anchor="middle" font-size="14" fill="#1a1008" font-weight="bold">问卦</text>
            </svg>
            <!-- 指针 -->
            <div class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1">
              <div class="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#c8a060]"></div>
            </div>
          </div>
        </div>

        <!-- 输入 -->
        <div class="mb-6">
          <textarea
            v-model="question"
            :placeholder="'心中所惑，落笔此处...'"
            rows="2"
            class="w-full resize-none rounded-lg border border-[#dcd0b8] bg-[#fffdf8] px-3 py-2 text-sm text-[#5a4a38] outline-none placeholder:text-[#b8a888] focus:border-[#c8a060] dark:border-[#3a2a1a] dark:bg-[#1a1410] dark:text-[#e8d4b8] dark:placeholder:text-[#4a3a28]"
          />
          <button
            @click="divine"
            :disabled="spinning || !question.trim()"
            class="mt-2 w-full rounded-lg bg-[#c8a060] py-2.5 text-sm font-semibold text-[#1a1008] transition hover:bg-[#d4b070] disabled:opacity-40"
          >{{ spinning ? '卦象生成中...' : '摇卦' }}</button>
        </div>

        <!-- 当前结果 -->
        <div v-if="result" class="mb-6 rounded-xl border border-[#dcd0b8] bg-[#fffdf8] p-6 text-center shadow-sm dark:border-[#3a2a1a] dark:bg-[#221a12]">
          <div class="text-2xl font-bold text-[#c8a060]">{{ result.signName }}</div>
          <div class="mt-2 text-sm text-[#8a7a60] dark:text-[#a08c70]">"{{ result.signPoem }}"</div>
          <div class="mt-4 flex justify-center gap-6">
            <div>
              <div class="text-xs font-semibold text-[#6a9a5a]">宜</div>
              <div class="mt-1 text-sm text-[#5a4a38] dark:text-[#d4c0a0]">{{ result.good }}</div>
            </div>
            <div class="w-px bg-[#dcd0b8] dark:bg-[#3a2a1a]"></div>
            <div>
              <div class="text-xs font-semibold text-[#a05050]">忌</div>
              <div class="mt-1 text-sm text-[#5a4a38] dark:text-[#d4c0a0]">{{ result.bad }}</div>
            </div>
          </div>
          <div class="mx-auto mt-4 h-px w-20 bg-[#dcd0b8] dark:bg-[#3a2a1a]"></div>
          <div class="mt-3 text-[13px] leading-relaxed text-[#8a7a60] dark:text-[#a08c70]">{{ result.advice }}</div>
        </div>

        <!-- 历史列表 -->
        <div v-if="history.length" class="space-y-3">
          <div v-for="item in history" :key="item.id"
            class="rounded-lg border border-[#dcd0b8] bg-[#fffdf8] px-4 py-3 dark:border-[#3a2a1a] dark:bg-[#221a12]">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-[#c8a060]">{{ item.signName }}</span>
              <span class="text-[11px] text-[#b8a888] dark:text-[#5a4a38]">{{ formatTime(item.createdAt) }}</span>
            </div>
            <div class="mt-1 text-xs text-[#8a7a60] dark:text-[#6a5840]">{{ item.question }}</div>
            <div class="mt-1 text-xs text-[#a08c70]">"{{ item.signPoem }}"</div>
          </div>
        </div>
        <div v-else-if="!result" class="py-8 text-center text-sm text-[#b8a888] dark:text-[#4a3a28]">
          尚无卦象记录
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const signs = ['上上签', '上吉签', '中上签', '中吉签', '中平签', '中下签', '下吉签', '下下签'];
const sliceColors = ['#f5ecd8', '#e8dcc4', '#f0e4d0', '#ddd0b8', '#f5ecd8', '#e8dcc4', '#f0e4d0', '#ddd0b8'];
const question = ref('');
const spinning = ref(false);
const wheelAngle = ref(0);
const result = ref(null);
const history = ref([]);

const slicePath = (i) => {
  const cx = 130, cy = 130, r = 120;
  const angle = 360 / signs.length;
  const a1 = (angle * i - 90) * Math.PI / 180;
  const a2 = (angle * (i + 1) - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
};

const sliceTextTransform = (i) => {
  const cx = 130, cy = 130, r = 75;
  const angle = 360 / signs.length;
  const mid = (angle * i + angle / 2 - 90) * Math.PI / 180;
  const x = cx + r * Math.cos(mid), y = cy + r * Math.sin(mid);
  const deg = angle * i + angle / 2;
  return `translate(${x},${y}) rotate(${deg})`;
};

const formatTime = (t) => {
  if (!t) return '';
  return t.replace('T', ' ').slice(0, 16);
};

const request = async (url, opts) => {
  const res = await fetch(url, { credentials: 'include', ...opts });
  return res.json();
};

const loadHistory = async () => {
  const data = await request('/apps/fortune/list?page=1&pageSize=30');
  if (data.success) history.value = data.items;
};

const divine = async () => {
  if (!question.value.trim() || spinning.value) return;
  spinning.value = true;

  const spins = 1440 + Math.random() * 720;
  wheelAngle.value += spins;

  const data = await request('/apps/fortune/divine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: question.value.trim() })
  });

  await new Promise(r => setTimeout(r, 4000));
  spinning.value = false;

  if (data.success) {
    result.value = data.item;
    history.value.unshift(data.item);
    question.value = '';
  }
};

onMounted(loadHistory);
</script>
