import { Globe, Lock } from "lucide-react";
import { cn } from "../../lib/cn.js";

const options = [
  { value: "review", title: "Publish Review", description: "A public review visible to other Brewed users.", icon: Globe },
  { value: "diary", title: "Personal Diary", description: "A private entry visible only to you.", icon: Lock },
];

function LogTypePicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="What are you logging?" className="grid gap-3 sm:grid-cols-2">
      {options.map(({ value: optionValue, title, description, icon: Icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optionValue)}
            className={cn(
              "flex flex-col items-start gap-5 rounded-box border p-4 text-left transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              active ? "border-primary bg-primary text-primary-content" : "border-base-300 bg-surface hover:border-secondary/40",
            )}
          >
            <span
              className={cn(
                "grid size-8 place-items-center rounded-lg",
                active ? "bg-primary-soft text-primary-content" : "bg-accent-soft text-accent",
              )}
            >
              <Icon size={16} />
            </span>
            <span>
              <span className="block text-[15px] font-medium">{title}</span>
              <span className={cn("mt-1 block text-[13px]", active ? "text-primary-content/70" : "text-secondary")}>
                {description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default LogTypePicker;
