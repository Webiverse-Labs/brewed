import { cn } from "../../lib/cn.js";

function StatCard({ value, label, delta, highlight }) {
  return (
    <div className="rounded-box border border-base-300 bg-surface p-5">
      <p className="font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-[15px]">{label}</p>
      <p className={cn("mt-2 text-xs", highlight ? "font-medium text-accent" : "text-secondary")}>{delta}</p>
    </div>
  );
}

export default StatCard;
