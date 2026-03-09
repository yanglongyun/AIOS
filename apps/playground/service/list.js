import { findAllVersions } from '../repository/list.js';

export const list = () => {
  const data = findAllVersions();
  return { success: true, data };
};
