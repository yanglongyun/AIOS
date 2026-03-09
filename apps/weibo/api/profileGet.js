import { profileGet } from '../service/profileGet.js';

export const getProfileHandler = () => {
  return profileGet();
};
