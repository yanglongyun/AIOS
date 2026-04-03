import { handleProducthuntApi } from "./api/index.js";
var stdin_default = {
  name: "producthunt",
  match: (path) => path.startsWith("/apps/producthunt/"),
  handleApi: handleProducthuntApi
};
export { stdin_default as default };
