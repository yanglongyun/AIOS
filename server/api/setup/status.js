import { countUsers } from '../../../shared/auth/repository.js';

export const getSetupStatus = () => ({
  success: true,
  initialized: countUsers() > 0
});
