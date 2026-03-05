export const parseJson = (raw, fallback = null) => {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
