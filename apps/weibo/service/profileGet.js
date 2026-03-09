import { getProfile } from '../repository/profile.js';

export const profileGet = () => {
  const row = getProfile();
  return {
    success: true,
    profile: {
      displayName: String(row?.displayName || 'twitter'),
      signature: String(row?.signature || ''),
      avatarUrl: String(row?.avatarUrl || ''),
      updatedAt: row?.updatedAt || null
    }
  };
};
