const appLoaders = [
    () => import("./sysinfo/index.js"),
    () => import("./cryptobot/index.js"),
    () => import("./longvideo/index.js"),
];

export {
    appLoaders,
};
