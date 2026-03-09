import { listEquity } from '../service/equity.js';

export const equityHandler = ({ limit } = {}) => listEquity({ limit });
