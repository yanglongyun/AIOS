import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const WS_URL = 'ws://localhost:9700/ws';
export const WEB_URL = 'http://localhost:9700';
export const API_URL = 'http://localhost:9700/api';
export const APPS_URL = 'http://localhost:9701';
