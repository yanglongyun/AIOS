import { profileSave } from '../service/profileSave.js';

export const saveProfileHandler = (body = {}) => {
  return profileSave(body);
};
