import { listTrades } from '../service.js';

export const listTradesHandler = ({ page, pageSize }) => listTrades({ page, pageSize });
