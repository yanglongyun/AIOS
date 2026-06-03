import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useViewStore = defineStore('view', () => {
  // 当前 app 内部侧栏开关.桌面默认开,手机默认关.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const appDrawerOpen = ref(!isMobile);
  // 系统级全局导航.桌面可在图标栏/展开栏之间切换;移动端展开为悬浮抽屉。
  const globalNavOpen = ref(!isMobile);
  const chatOpen = ref(false);
  // 一次性的 Chat 输入草稿:其他入口(例如应用面板的「+」)
  // 想把一段话塞进 Chat 的输入框时往这里写,Chat 挂载时读一次并清空。
  const chatDraft = ref('');

  function toggleAppDrawer()  { appDrawerOpen.value = !appDrawerOpen.value; }
  function closeAppDrawer()   { appDrawerOpen.value = false; }
  function openAppDrawer()    { appDrawerOpen.value = true; }

  function toggleGlobalNav() {
    globalNavOpen.value = !globalNavOpen.value;
  }
  function closeGlobalNav() {
    globalNavOpen.value = false;
  }
  function openGlobalNav()  {
    globalNavOpen.value = true;
  }

  function toggleChat() {
    chatOpen.value = !chatOpen.value;
    if (chatOpen.value) closeGlobalNav();
  }
  function closeChat() { chatOpen.value = false; }

  function setChatDraft(text) { chatDraft.value = String(text || ''); }
  function consumeChatDraft() {
    const v = chatDraft.value;
    chatDraft.value = '';
    return v;
  }

  return {
    appDrawerOpen, globalNavOpen, chatOpen, chatDraft,
    toggleAppDrawer, closeAppDrawer, openAppDrawer,
    toggleGlobalNav, closeGlobalNav, openGlobalNav,
    toggleChat, closeChat,
    setChatDraft, consumeChatDraft
  };
});
