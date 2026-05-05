const appLoaders = [
    () => import("./sysinfo/index.js"),
    () => import("./workshop/index.js"),
    () => import("./claude-code/index.js"),
    () => import("./cryptobot/index.js"),
];

export {
    appLoaders,
};
