export const intent = {
  async open(ctx) {
    const { payload, existingWindow, openWindow, focusWindow } = ctx;
    if (existingWindow) {
      focusWindow(existingWindow.id);
      return existingWindow;
    }
    return openWindow({ highlightId: payload?.data?.highlightId ?? null });
  }
};
