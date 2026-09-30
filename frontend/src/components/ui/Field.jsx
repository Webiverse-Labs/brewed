import { cn } from "../../lib/cn.js";

// Uppercase label wrapping a control. As a <label> it needs no htmlFor/id pairing.
// Use as="div" when the child is a group of buttons or has its own <label> (BeanRating, DashedUpload) —
// a wrapping <label> would forward clicks to the first button inside.
function Field({ as: Tag = "label", label, required, hint, className, children }) {
  return (
    <Tag className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs font-semibold tracking-wide text-base-content uppercase">
        {label}
        {required && " *"}
      </span>
      {children}
      {hint && <span className="text-xs text-secondary">{hint}</span>}
    </Tag>
  );
}

export default Field;
