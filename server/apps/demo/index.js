import { handleDemoApi } from "./api.js";
import { initDemoDatabase } from "./repository.js";

export default {
    name: "demo",
    match: (path) => path.startsWith("/apps/demo/"),
    initDb: initDemoDatabase,
    handleApi: handleDemoApi,
};
