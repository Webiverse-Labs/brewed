import { inputClass } from "./inputStyles.js";
import { cn } from "../../lib/cn.js";

// `icon` is a lucide component rendered inside the left edge (e.g. Search).
function TextInput({ look = "filled", icon: Icon, className, ...props }) {
  if (!Icon) return <input className={inputClass(look, cn("h-11 px-4", className))} {...props} />;

  return (
    <div className={cn("relative", className)}>
      <Icon size={17} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-secondary" />
      <input className={inputClass(look, "h-11 pr-4 pl-11")} {...props} />
    </div>
  );
}

export default TextInput;
