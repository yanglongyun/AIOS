import { upsertProfile, getProfile } from '../repository/focus.js';
import { reschedule } from '../runtime/index.js';

export const updateFocus = (body = {}) => {
  const focus = String(body.focus || '').trim();
  const scheduleTime = String(body.scheduleTime || '08:00').trim();
  upsertProfile(focus, scheduleTime);

  // 重新调度定时任务
  reschedule();

  const profile = getProfile();
  return {
    success: true,
    profile: {
      focus: profile?.focus || '',
      scheduleTime: profile?.scheduleTime || '08:00',
      updatedAt: profile?.updatedAt || null
    }
  };
};
