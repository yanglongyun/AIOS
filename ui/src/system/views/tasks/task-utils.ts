export const statusBadgeClass = (status: string) => {
  if (status === "running" || status === "pending") return "badge-warning";
  if (status === "done" || status === "completed" || status === "success") return "badge-success";
  if (status === "aborted" || status === "cancelled") return "badge-neutral";
  if (status === "error" || status === "failed") return "badge-danger";
  return "";
};
