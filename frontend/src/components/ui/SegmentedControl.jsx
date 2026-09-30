import { cn } from "../../lib/cn.js";
import { moveTabFocus } from "../../lib/tablistKeys.js";

// Sand track with an espresso thumb (Sign Up / Log In).
function SegmentedControl({ options, value, onChange, className, label = "Choose" }) {
  const activeIndex = Math.max(0, options.findIndex((opt) => opt.value === value));
  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={moveTabFocus}
      className={cn("grid rounded-full bg-base-200 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => onChange(opt.value)}
            className={cn(
              "h-9 rounded-full text-[15px] font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-accent",
              active ? "bg-primary text-primary-content" : "text-base-content hover:bg-base-300/50",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
