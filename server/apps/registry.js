// @ts-nocheck
// 已注册的应用后端。新增 app = 加一行 loader。
const appLoaders = [
  () => import("./notepad/index.js"),
  () => import("./todo/index.js"),
  () => import("./ledger/index.js"),
];

export { appLoaders };
