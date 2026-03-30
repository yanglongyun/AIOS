import { reactive } from "vue";
const state = reactive({
  pendingMessage: null,
  requestOpen: 0,
  quickMessages: [],
  context: null
  // { scene: 'notebook', label: '随心记' }
});
const chatPanel = {
  state,
  open(message = null) {
    state.pendingMessage = message;
    state.requestOpen++;
  },
  setQuickMessages(messages) {
    state.quickMessages = Array.isArray(messages) ? messages.slice(0, 3) : [];
  },
  setContext(ctx) {
    state.context = ctx && ctx.scene ? ctx : null;
  },
  clearContext() {
    state.context = null;
  },
  clearPending() {
    state.pendingMessage = null;
  }
};
export {
  chatPanel
};
