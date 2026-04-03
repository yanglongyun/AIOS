const appLoaders = [
  () => import("./notebook/index.js"),
  () => import("./finance/index.js"),
  () => import("./subscriber/index.js"),
  () => import("./cryptobot/index.js"),
  () => import("./reader/index.js"),
  () => import("./fortune/index.js"),
  () => import("./poker/index.js"),
  () => import("./banana/index.js"),
  () => import("./createapp/index.js"),
  () => import("./hackernews/index.js"),
  () => import("./coinmarket/index.js"),
  () => import("./earthquake/index.js"),
  () => import("./weather/index.js"),
  () => import("./ghtrending/index.js"),
  () => import("./wikitree/index.js"),

  () => import("./rssreader/index.js")
];
export {
  appLoaders
};
