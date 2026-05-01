const appLoaders = [
    () => import("./todo/index.js"),
    () => import("./notebook/index.js"),
    () => import("./finance/index.js"),
    () => import("./cryptobot/index.js"),
];

export {
    appLoaders,
};
