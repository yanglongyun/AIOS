import type { AnyRecord } from '../../shared/types.ts';
import { broadcast } from '../system/ws.ts';

/**
 * AI 可直接 import 并调用此函数，通过 WS 向前端推送重载请求。
 *
 * @param {object} options
 * @param {boolean} [options.build=false]   — 是否重新编译前端
 * @param {string}  [options.restart]       — 'server' | 'apps' | 'both' | null
 * @param {string}  [options.message]       — 弹窗中展示的附加说明
 */
export const requestReload = (options: AnyRecord = {}) => {
  broadcast({
    type: 'reload_request',
    build: options.build ?? false,
    restart: options.restart || null,
    message: options.message || ''
  });
};
