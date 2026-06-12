// @ts-nocheck
// 记账本 app 入口:仅组装导出,请求转给 api 层。
import { match, handleApi, initDb } from "./api/index.js";

export default { name: "ledger", match, handleApi, initDb };
