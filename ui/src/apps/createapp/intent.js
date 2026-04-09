const intent = {
  async open({ existingWindow, openWindow, focusWindow, payload }) {
    const action = payload.action || 'open';
    if (action !== 'open') {
      throw new Error(`Unsupported createapp intent action: ${action}`);
    }

    if (existingWindow) {
      focusWindow(existingWindow.id);
      return existingWindow;
    }

    return openWindow();
  }
};

export {
  intent
};
