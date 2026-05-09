import { defineStore } from 'pinia';
import { ref } from 'vue';

// 应用主动告知 AI 的临时上下文 + 给用户的快捷 prompt。
// QuickChat 读这个 store:
//   - 把 `context` 随每条消息透传给后端,后端拼进 system prompt(本轮有效,不入库)
//   - 把 `prompts` 渲染成 chip 行,点击直接发送对应文本
//
// 用法(应用挂载时):
//   import { useAppContext } from '@/stores/appContext';
//   const ctx = useAppContext();
//   onMounted(() => {
//     ctx.set({
//       context: '用户在记账本,当前查看 2026-05 月度账目,共 23 笔',
//       prompts: [
//         { label: '本月有异常吗', text: '帮我看看本月有没有异常或重复的支出' },
//         { label: '生成报告',     text: '把本月账目做个简短总结' }
//       ]
//     });
//   });
//   onBeforeUnmount(() => ctx.clear());
//
// 状态会随导航变化时,把 set 包到 watchEffect 即可。
export const useAppContext = defineStore('appContext', () => {
  const context = ref('');
  const prompts = ref([]);

  function set({ context: ctx = '', prompts: ps = [] } = {}) {
    context.value = String(ctx || '');
    prompts.value = Array.isArray(ps)
      ? ps.filter((p) => p && typeof p.label === 'string' && typeof p.text === 'string')
      : [];
  }

  function clear() {
    context.value = '';
    prompts.value = [];
  }

  return { context, prompts, set, clear };
});
