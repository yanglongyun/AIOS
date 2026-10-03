// 应用子域名的根域名(见 appProxy.ts)。未配置时为空串。
export const appDomain = () => String(process.env.AIOS_APP_DOMAIN || "").trim().toLowerCase().replace(/^\.+|\.+$/g, "");
