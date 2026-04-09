const taskDetailWindow = {
  key: 'tasks:detail',
  appId: 'tasks',
  title: '__T_APP_SIDEBAR_TASKS__',
  icon: '✅',
  desktopLoad: () => import('./detail.vue'),
  defaultDesktopWindowSize: { w: 800, h: 560 }
};

const taskCreateWindow = {
  key: 'tasks:create',
  appId: 'tasks',
  title: '__T_APP_SIDEBAR_TASKS__',
  icon: '✅',
  desktopLoad: () => import('./create.vue'),
  defaultDesktopWindowSize: { w: 700, h: 500 }
};

const intent = {
  async open({ payload, existingWindow, openWindow, openComponent, focusWindow }) {
    const action = payload.action || 'open';

    if (action === 'open') {
      if (existingWindow) {
        focusWindow(existingWindow.id);
        return existingWindow;
      }
      return openWindow();
    }

    if (action === 'open_create') {
      return openComponent(taskCreateWindow);
    }

    throw new Error(`Unsupported tasks intent action: ${action}`);
  }
};

export {
  intent,
  taskDetailWindow,
  taskCreateWindow
};
