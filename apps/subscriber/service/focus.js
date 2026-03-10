import { upsertProfile, getProfile } from '../repository/focus.js';

export const updateFocus = (body = {}) => {
  const focus = String(body.focus || '').trim();
  upsertProfile(focus);

  const profile = getProfile();
  return {
    success: true,
    profile: {
      focus: profile?.focus || '',
      updatedAt: profile?.updatedAt || null
    }
  };
};
