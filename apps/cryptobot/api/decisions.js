import { listDecisions } from '../service/decisions.js';

export const decisionsHandler = ({ limit } = {}) => listDecisions({ limit });
