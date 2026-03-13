import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const SERVER_PORT = 9700;
export const APPS_PORT = 9701;
export const WS_URL = `ws://localhost:${SERVER_PORT}/ws`;
export const WEB_URL = `http://localhost:${SERVER_PORT}`;
export const API_URL = `http://localhost:${SERVER_PORT}/api`;
export const APPS_URL = `http://localhost:${APPS_PORT}`;
