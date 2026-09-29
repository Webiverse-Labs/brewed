import { cn } from "../../lib/cn.js";

// Pill tabs. `tabs` is [{ value, label }]; the active pill is espresso.
function FilterTabs({ tabs, value, onChange, size = "md", className, label = "Filter" }) {
  return (
    <div role="tablist" aria-label={label} className={cn("scrollbar-none flex gap-2 overflow-x-auto", className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "shrink-0 rounded-full border whitespace-nowrap transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              size === "sm" ? "h-8 px-3.5 text-sm" : "h-9 px-4 text-[15px]",
              active
                ? "border-primary bg-primary text-primary-content"
                : "border-base-300 bg-base-100 text-base-content hover:bg-base-200",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
