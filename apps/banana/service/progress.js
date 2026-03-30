import { getLatestSession } from "../repository/progress.js";
const DEFAULT_SCREEN = {
  content: `<div style="text-align:center;padding:20px;font-family:monospace;">
          <h2 style="margin:0 0 8px;font-size:16px;">Banana 3310</h2>
          <p style="margin:4px 0;font-size:12px;">\u6B22\u8FCE\u4F7F\u7528\u7ECF\u5178\u624B\u673A\u6A21\u62DF\u5668</p>
          <hr style="border-color:#333;margin:8px 0;">
          <p style="margin:4px 0;font-size:11px;">\u8BF7\u9009\u62E9\u4E00\u4E2A\u529F\u80FD\u5F00\u59CB\u4F7F\u7528...</p>
        </div>`,
  options: [
    { text: "\u67E5\u770B\u77ED\u4FE1" },
    { text: "\u6253\u7535\u8BDD" },
    { text: "\u73A9\u8D2A\u5403\u86C7" },
    { text: "\u67E5\u770B\u8054\u7CFB\u4EBA" }
  ]
};
const getProgress = () => {
  const row = getLatestSession();
  if (!row) {
    return {
      current_screen: DEFAULT_SCREEN,
      isNew: true
    };
  }
  let currentScreen;
  try {
    currentScreen = JSON.parse(row.current_screen);
  } catch {
    currentScreen = { content: "", options: [] };
  }
  return {
    current_screen: currentScreen,
    battery_level: row.battery_level,
    isNew: false
  };
};
export {
  getProgress
};
