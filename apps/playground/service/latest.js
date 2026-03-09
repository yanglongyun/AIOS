import { findLatestVersion } from '../repository/latest.js';

export const latest = () => {
  const row = findLatestVersion();
  if (!row) return { success: true, data: null };

  return {
    success: true,
    data: {
      id: row.id,
      name: row.name,
      prompt: row.prompt,
      html: row.html,
      created_at: row.created_at
    }
  };
};
