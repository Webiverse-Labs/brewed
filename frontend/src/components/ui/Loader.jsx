import { cn } from "../../lib/cn.js";

// Centered spinner for sections and pages that are still loading.
function Loader({ fullScreen, className }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("grid place-items-center text-secondary", fullScreen ? "min-h-screen" : "py-16", className)}
    >
      <span className="loading loading-md loading-spinner" />
    </div>
  );
}

export default Loader;
