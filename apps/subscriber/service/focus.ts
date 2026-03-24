import type { AnyRecord } from '../../../shared/types.ts';
import { upsertProfile, getProfile } from '../repository/focus.ts';
import { reschedule } from '../runtime/index.ts';

export const updateFocus = (body: AnyRecord = {}) => {
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
