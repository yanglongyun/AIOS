<template>
  <div class="flex h-full flex-col bg-[#f5f0e8] font-['Georgia','PingFang_SC',serif]">
    <!-- Top: Hero + Input (sticky) -->
    <div class="shrink-0 px-6 pt-6 pb-4">
      <CreateAppHero />
      <div class="mt-5 max-w-[560px] mx-auto">
        <textarea
          ref="inputRef"
          v-model="prompt"
          rows="3"
          class="w-full min-h-[88px] rounded-xl border border-[#d4c0a0] bg-[#fffdf8] px-4 py-3 text-sm leading-[1.65] text-[#4a3a28] placeholder-[#b0a090] outline-none focus:border-[#c8a060] transition-colors"
          placeholder="__T_CREATEAPP_PLACEHOLDER__"
          @compositionstart="composing = true"
          @compositionend="composing = false"
          @keydown.enter="!composing && create()"
        />
        <div class="mt-3 flex justify-center">
          <button
            class="rounded-xl bg-[#5a3e28] px-5 py-2.5 text-sm text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)] transition-opacity hover:opacity-90 disabled:opacity-40"
            :disabled="!prompt.trim()"
            @click="create"
          >
            立即创建
          </button>
        </div>
        <div class="mt-5 flex items-center gap-3 text-[#a09080]">
          <div class="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(180,160,130,0.9))]"></div>
          <div class="shrink-0 text-[12px] font-semibold tracking-[0.12em]">灵感库</div>
          <div class="h-px flex-1 bg-[linear-gradient(90deg,rgba(180,160,130,0.9),transparent)]"></div>
        </div>
      </div>
    </div>

    <!-- Category tabs -->
    <div class="shrink-0 px-6 pb-3">
      <div class="flex gap-2 max-w-[520px] mx-auto">
        <button v-for="cat in categories" :key="cat.key"
          class="px-3 py-1.5 rounded-lg text-[12px] transition-all"
          :class="activeCategory === cat.key
            ? 'bg-[#5a3e28] text-[#f0e8d8] shadow-sm'
            : 'bg-[#ebe6dc] text-[#8a7a68] hover:bg-[#e0d9cd]'"
          @click="activeCategory = cat.key">
          {{ cat.emoji }} {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Inspiration grid -->
    <div class="flex-1 overflow-y-auto px-6 pb-6">
      <div class="max-w-[560px] mx-auto">
        <div class="grid grid-cols-2 gap-3">
        <div v-for="tpl in filteredTemplates" :key="tpl.name"
          class="group cursor-pointer rounded-xl border border-[#e4ddd0] bg-[#fffdf8] p-3.5 transition-all hover:border-[#c8a060] hover:shadow-[0_4px_12px_rgba(90,62,40,0.08)] hover:-translate-y-0.5"
          @click="selectTemplate(tpl)">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-base">{{ tpl.emoji }}</span>
            <span class="text-[13px] font-semibold text-[#5a4a38]">{{ tpl.name }}</span>
          </div>
          <p class="text-[11px] leading-[1.6] text-[#a09080]">{{ tpl.desc }}</p>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CreateAppHero from './CreateAppHero.vue';
import { openIntent } from '../../system/intent.js';

const prompt = ref('');
const composing = ref(false);
const inputRef = ref(null);
const activeCategory = ref('all');

const categories = [
  { key: 'all', emoji: '✨', label: '__T_CREATEAPP_CAT_ALL__' },
  { key: 'ai', emoji: '🧠', label: '__T_CREATEAPP_CAT_AI__' },
  { key: 'tool', emoji: '🔧', label: '__T_CREATEAPP_CAT_TOOL__' },
  { key: 'game', emoji: '🎮', label: '__T_CREATEAPP_CAT_GAME__' },
  { key: 'life', emoji: '🌿', label: '__T_CREATEAPP_CAT_LIFE__' },
  { key: 'business', emoji: '💼', label: '商业' },
  { key: 'productivity', emoji: '⚡', label: '效率' },
];

const templates = [
  { cat: 'ai', emoji: '📊', name: '__T_CREATEAPP_TPL_COMPETITOR__', desc: '创建一个竞品分析应用，支持录入多个竞品名称、产品定位、价格、核心功能和目标用户，并自动生成对比表、优劣势总结、差异化建议和可执行的市场切入方向。界面要清晰，适合做策略分析。' },
  { cat: 'ai', emoji: '✍️', name: '__T_CREATEAPP_TPL_COPYWRITER__', desc: '创建一个 AI 文案工作台，支持输入产品信息、目标用户、投放平台和文案语气，自动生成标题、短文案、长文案、卖点摘要和多个改写版本，并支持收藏、复制和按场景切换模板。' },
  { cat: 'ai', emoji: '📋', name: '__T_CREATEAPP_TPL_PROPOSAL__', desc: '创建一个提案生成应用，支持录入客户背景、项目目标、预算区间、时间周期和执行方案，自动整理成结构化提案，包括项目概述、交付内容、时间排期、报价说明和风险提示。' },
  { cat: 'ai', emoji: '🧑‍💼', name: '__T_CREATEAPP_TPL_INTERVIEW__', desc: '创建一个面试助手应用，支持岗位描述、候选人简历、面试轮次和重点考察项，自动生成面试题、追问建议、评分维度、候选人评价记录和最终结论，适合招聘流程使用。' },
  { cat: 'ai', emoji: '🗺️', name: '__T_CREATEAPP_TPL_MINDMAP__', desc: '创建一个思维导图应用，支持输入主题后自动拆分子主题、关键问题、行动建议和层级关系，能够以卡片或树形结构展示，并支持手动补充节点、折叠展开和导出大纲。' },
  { cat: 'ai', emoji: '🎭', name: '__T_CREATEAPP_TPL_PERSONA__', desc: '创建一个用户画像应用，支持根据用户群体、年龄、职业、消费能力、需求和痛点自动生成人物卡，包括典型场景、行为模式、决策因素、常见 objections 和产品机会点。' },
  { cat: 'tool', emoji: '🔑', name: '__T_CREATEAPP_TPL_PASSWORD__', desc: '创建一个密码工具应用，支持生成高强度密码、批量生成、按长度和字符规则自定义、密码强度评分、常用模板切换以及一键复制。界面简洁，强调安全感和效率。' },
  { cat: 'tool', emoji: '🎨', name: '__T_CREATEAPP_TPL_COLOR__', desc: '创建一个配色工具应用，支持主色输入后自动生成配色方案，包括互补色、邻近色、渐变色、浅深层级和按钮/背景/文字的实际应用示例，并支持一键复制 HEX/RGB 值。' },
  { cat: 'tool', emoji: '📐', name: '__T_CREATEAPP_TPL_REGEX__', desc: '创建一个正则表达式工具应用，支持输入文本和规则进行实时匹配，展示命中结果、高亮片段、分组信息和常用规则示例，并提供测试区、说明区和错误提示。' },
  { cat: 'game', emoji: '🐍', name: '__T_CREATEAPP_TPL_SNAKE__', desc: '创建一个贪吃蛇小游戏，支持键盘操作、计分、速度递增、重新开始、暂停和移动端基础适配。整体风格不要太普通，可以更复古一点，操作和动画要顺滑。' },
  { cat: 'game', emoji: '🃏', name: '__T_CREATEAPP_TPL_MEMORY__', desc: '创建一个记忆翻牌游戏，支持多种难度、计时、步数统计、完成结算和重新开始。卡片视觉要有趣，翻牌动画清晰，适合轻松休闲场景。' },
  { cat: 'game', emoji: '⚔️', name: '__T_CREATEAPP_TPL_ADVENTURE__', desc: '创建一个文字冒险游戏，支持角色状态、剧情分支、物品收集、对话推进和关键选择。界面要有氛围感，让用户像在看互动小说而不是普通表单。' },
  { cat: 'life', emoji: '🍳', name: '__T_CREATEAPP_TPL_RECIPE__', desc: '创建一个菜谱应用，支持按食材、口味和烹饪方式筛选，展示做法步骤、准备时间、难度、用量清单和收藏功能，并且可以录入自己的私房菜谱。' },
  { cat: 'life', emoji: '⏳', name: '__T_CREATEAPP_TPL_COUNTDOWN__', desc: '创建一个倒计时应用，支持多个事件卡片、目标日期设置、剩余时间显示、进度条、提醒文案和重要日分类，例如生日、旅行、考试和项目截止日。' },
  { cat: 'business', emoji: '📦', name: '库存管理', desc: '创建一个库存管理应用，支持商品列表、分类、SKU、入库出库、当前库存、库存预警、供应商信息和按条件搜索筛选。需要有清晰的数据表格和方便的录入编辑体验。' },
  { cat: 'business', emoji: '🧾', name: '报价单生成器', desc: '创建一个报价单应用，支持录入客户信息、项目名称、价格项、数量、税率、备注和有效期，自动计算总价并生成规范的报价清单，适合商务沟通和方案报价。' },
  { cat: 'business', emoji: '👥', name: '客户跟进板', desc: '创建一个客户跟进应用，支持客户资料、来源渠道、跟进阶段、负责人、下次联系时间、跟进纪要和成交状态，适合销售或顾问型业务的日常管理。' },
  { cat: 'productivity', emoji: '📆', name: '计划日历', desc: '创建一个计划日历应用，支持按天、周、月查看日程，支持优先级、颜色标签、提醒时间、完成状态和快速新增编辑，整体体验要轻巧而高效。' },
  { cat: 'productivity', emoji: '🗂️', name: '项目看板', desc: '创建一个项目看板应用，支持待办、进行中、已完成三列，支持卡片拖拽、负责人、截止时间、标签和任务详情面板，适合个人或小团队管理项目。' },
  { cat: 'productivity', emoji: '⏱️', name: '番茄专注', desc: '创建一个番茄钟应用，支持专注计时、短休息和长休息切换，显示今日专注次数、总时长、专注记录和提醒状态，界面要安静克制，适合长期使用。' },
];

const filteredTemplates = computed(() =>
  activeCategory.value === 'all' ? templates : templates.filter(t => t.cat === activeCategory.value)
);

const selectTemplate = (tpl) => {
  prompt.value = tpl.desc;
  inputRef.value?.focus();
};

const create = () => {
  if (!prompt.value.trim()) return;
  openIntent({
    app: 'chat',
    action: 'open_new_and_send',
    data: { message: prompt.value.trim() }
  });
  prompt.value = '';
};
</script>
