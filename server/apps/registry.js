const appLoaders = [
    () => import("./sysinfo/index.js"),
    () => import("./cryptobot/index.js"),
    () => import("./longvideo/index.js"),
    () => import("./demogen/index.js"),
    () => import("./codex/index.js"),
];

export {
    appLoaders,
};
