import { cn } from "../../lib/cn.js";

// Status colors are placeholders until the admin screens are exported (docs/ui/tokens.md).
const styles = {
  pending: "badge-warning",
  approved: "badge-success",
  active: "badge-success",
  rejected: "badge-error",
  suspended: "badge-error",
  disabled: "badge-neutral",
};

function StatusBadge({ status, className }) {
  return <span className={cn("badge badge-soft badge-sm font-medium capitalize", styles[status], className)}>{status}</span>;
}

export default StatusBadge;
