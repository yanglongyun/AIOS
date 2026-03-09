import { getGameState } from '../service/state.js';

export const stateHandler = (query = {}) => {
  return getGameState(query);
};
