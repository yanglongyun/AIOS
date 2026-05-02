// 应用内 quick-chat (右侧 sheet) 的状态：开关 + 当前 app 注入的上下文。
//
// 使用方式：
//   const qc = useQuickChatStore();
//   qc.setContext({ scope: 'notebook:edit:42', label: '笔记: 项目计划',
//                   snapshot: '标题: ...\n正文片段: ...' });
//   // 用户点 launcher 的对话按钮 → qc.open=true → QuickChat sheet 打开
//
// snapshot 是一段会拼到下一条 outgoing 消息前面的纯文本上下文 (作为引用块)。
// label 是 sheet 顶部芯片显示的简短描述,用户可以一键关掉本次携带。
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useQuickChatStore = defineStore('quickChat', () => {
    const open = ref(false);
    const context = ref(null);
    const includeContext = ref(true);

    const effectiveSnapshot = computed(() => {
        if (!includeContext.value) return '';
        const ctx = context.value;
        if (!ctx?.snapshot) return '';
        const header = ctx.label
            ? '__T_QC_PREFACE_WITH_LABEL__'.replace('{label}', ctx.label)
            : '__T_QC_PREFACE_DEFAULT__';
        return `${header}\n${ctx.snapshot}`;
    });

    function setContext(ctx) {
        if (!ctx) { context.value = null; return; }
        const same = context.value && context.value.scope === ctx.scope;
        context.value = { ...ctx };
        if (!same) includeContext.value = true;
    }
    function clearContext() {
        context.value = null;
    }
    function show()   { open.value = true; }
    function hide()   { open.value = false; }
    function toggle() { open.value = !open.value; }

    return {
        open, context, includeContext, effectiveSnapshot,
        setContext, clearContext, show, hide, toggle,
    };
});
