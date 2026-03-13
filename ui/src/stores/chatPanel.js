import { reactive } from 'vue';

const state = reactive({
  pendingMessage: null,
  requestOpen: 0,
  quickMessages: []
});

export const chatPanel = {
  state,
  open(message = null) {
    state.pendingMessage = message;
    state.requestOpen++;
  },
  setQuickMessages(messages) {
    state.quickMessages = Array.isArray(messages) ? messages.slice(0, 3) : [];
  },
  clearPending() {
    state.pendingMessage = null;
  }
};
