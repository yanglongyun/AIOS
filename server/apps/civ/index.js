import { handleCivApi } from "./api/index.js";

export default {
  name: "civ",
  match: (path) => path.startsWith("/apps/civ/"),
  handleApi: handleCivApi
};
