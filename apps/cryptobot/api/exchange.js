import { saveExchange } from '../service/exchange.js';

export const exchangeHandler = (body) => saveExchange(body);
