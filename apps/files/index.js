import { handleFilesApi } from "./api/index.js";
var stdin_default = {
  name: "files",
  match: (path) => path.startsWith("/api/files/"),
  handleApi: handleFilesApi
};
export {
  stdin_default as default
};
