import { handleEarthquakeApi } from "./api/index.js";
var stdin_default = {
  name: "earthquake",
  match: (path) => path.startsWith("/apps/earthquake/"),
  handleApi: handleEarthquakeApi
};
export {
  stdin_default as default
};
