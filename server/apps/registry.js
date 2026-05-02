const appLoaders = [
    () => import("./notebook/index.js"),
    () => import("./finance/index.js"),
    () => import("./cryptobot/index.js"),
    () => import("./demo/index.js"),
];

export {
    appLoaders,
};
