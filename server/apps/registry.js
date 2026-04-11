const appLoaders = [
  () => import("./notebook/index.js"),
  () => import("./finance/index.js"),
  () => import("./cryptobot/index.js"),
  () => import("./ghtrending/index.js"),
  () => import("./createapp/index.js")
];
export {
  appLoaders
};
