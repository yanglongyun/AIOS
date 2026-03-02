import { reactive } from 'vue';

const state = reactive({
  visible: false,
  message: '',
  type: 'success'
});

let timer = null;

const clearTimer = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

export const toast = {
  state,
  show(message, { type = 'success', duration = 2200 } = {}) {
    clearTimer();
    state.message = String(message || '').trim();
    state.type = type;
    state.visible = Boolean(state.message);
    if (!state.visible) return;
    timer = setTimeout(() => {
      state.visible = false;
      timer = null;
    }, duration);
  },
  hide() {
    clearTimer();
    state.visible = false;
  }
};

