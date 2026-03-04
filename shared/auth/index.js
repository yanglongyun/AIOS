import { checkAccess } from './access.js';

// 唯一对外入口：调用方只需要 access(...) 即可完成鉴权/初始化门禁。
export const access = (req, path, method, scope) => checkAccess({ req, path, method, scope });
