import { getProfile, getLatestDaily } from '../repository/today.js';

export const getToday = () => {
  const profile = getProfile();
  const today = getLatestDaily();

  return {
    success: true,
    profile: {
      focus: profile?.focus || '',
      updatedAt: profile?.updatedAt || null
    },
    today: today || null
  };
};
