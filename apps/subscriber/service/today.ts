import { getProfile, getLatestDaily } from '../repository/today.ts';

export const getToday = () => {
  const profile = getProfile();
  const today = getLatestDaily();

  return {
    success: true,
    profile: {
      focus: profile?.focus || '',
      scheduleTime: profile?.scheduleTime || '08:00',
      updatedAt: profile?.updatedAt || null
    },
    today: today || null
  };
};
