// @ts-nocheck
// 记事本 app 入口:仅组装导出,请求转给 api 层。
import { match, handleApi, initDb } from "./api/index.js";

export default { name: "notepad", match, handleApi, initDb };
