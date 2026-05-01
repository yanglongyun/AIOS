import { handleTodoApi } from "./api.js";
import { initTodoDatabase } from "./repository.js";

export default {
    name: "todo",
    match: (path) => path.startsWith("/apps/todo/"),
    initDb: initTodoDatabase,
    handleApi: handleTodoApi,
};
