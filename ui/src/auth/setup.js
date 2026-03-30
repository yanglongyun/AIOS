const getSetupStatus = async () => {
  try {
    const res = await fetch("/aios/api/system/setup", { credentials: "include" });
    const data = await res.json();
    return { initialized: Boolean(res.ok && data?.initialized) };
  } catch {
    return { initialized: false };
  }
};
export {
  getSetupStatus
};
