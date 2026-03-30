import { broadcast } from "../system/ws.js";
const requestReload = (options = {}) => {
  broadcast({
    type: "reload_request",
    build: options.build ?? false,
    restart: options.restart || null,
    message: options.message || ""
  });
};
export {
  requestReload
};
