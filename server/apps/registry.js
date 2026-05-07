const appLoaders = [
    () => import("./sysinfo/index.js"),
    () => import("./workshop/index.js"),
    () => import("./claude-code/index.js"),
    () => import("./cryptobot/index.js"),
    () => import("./subbox/index.js"),
    () => import("./banana/index.js"),
    () => import("./fortune/index.js"),
    () => import("./ghtrending/index.js"),
    () => import("./rssreader/index.js"),
    () => import("./poker/index.js"),
    () => import("./hackernews/index.js"),
    () => import("./debate/index.js"),
    () => import("./treasure/index.js"),
    () => import("./earthquake/index.js"),
];

export {
    appLoaders,
};
