import { handleWeatherApi } from "./api/index.js";
import { initWeatherDatabase } from "./repository/init.js";
var stdin_default = {
  name: "weather",
  match: (path) => path.startsWith("/apps/weather/"),
  initDb: initWeatherDatabase,
  handleApi: handleWeatherApi
};
export {
  stdin_default as default
};
