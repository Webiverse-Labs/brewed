import { dashedClass } from "./inputStyles.js";
import { cn } from "../../lib/cn.js";

// Dashed "Add an item" style button.
function DashedButton({ icon: Icon, children, className, ...props }) {
  return (
    <button type="button" className={cn(dashedClass, className)} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export default DashedButton;
