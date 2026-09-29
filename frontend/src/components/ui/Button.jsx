import { Link } from "react-router-dom";
import { cn } from "../../lib/cn.js";

const variants = {
  primary: "bg-primary text-primary-content hover:bg-primary-soft",
  outline: "border border-base-300 bg-surface text-base-content hover:bg-base-200",
  ghost: "text-base-content hover:bg-base-200",
  accentSoft: "bg-accent-soft text-accent hover:bg-accent/15",
  danger: "bg-error text-error-content hover:bg-error/90",
  dangerSoft: "bg-error/10 text-error hover:bg-error/15",
};

const sizes = {
  md: "h-11 px-5 text-[15px] gap-2",
  sm: "h-8 px-3 text-sm gap-1.5",
};

// `to` renders a router Link; otherwise a <button>.
function Button({ variant = "primary", size = "md", shape = "field", block, to, className, children, ...props }) {
  const classes = cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50",
    shape === "pill" ? "rounded-full" : "rounded-field",
    variants[variant],
    sizes[size],
    // block buttons must be able to shrink so two can sit side by side
    block ? "w-full" : "shrink-0",
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}

export default Button;
