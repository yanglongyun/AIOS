// @ts-nocheck
const messageSources = new Set(["user", "ai", "tool", "subscription"]);

const requireMessageSource = (source) => {
  const value = String(source || "").trim();
  if (!messageSources.has(value)) {
    throw new Error("message source is required");
  }
  return value;
};

export { requireMessageSource };
