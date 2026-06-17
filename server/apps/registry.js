// @ts-nocheck
const appLoaders = [
  () => import("./todo/index.js"),
  () => import("./notepad/index.js"),
  () => import("./ledger/index.js"),
];

export { appLoaders };
