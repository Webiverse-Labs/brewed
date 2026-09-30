import { cn } from "../../lib/cn.js";

// "filled"   — sand background, no border (auth, suggest form, order items)
// "outlined" — white with a border (Log a Visit, admin search)
export const inputClass = (look = "filled", extra) =>
  cn(
    "w-full rounded-field text-[15px] text-base-content placeholder:text-muted transition-shadow",
    "outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
    look === "filled" ? "bg-base-200" : "border border-base-300 bg-surface",
    extra,
  );

// Dashed box used by "Add an item", "Add a photo" and "Click to upload photos".
export const dashedClass = cn(
  "flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-field",
  "border-[1.5px] border-dashed border-base-300 text-[15px] text-base-content transition-colors hover:bg-base-200/60",
  "focus-visible:outline-2 focus-visible:outline-accent focus-within:outline-2 focus-within:outline-accent",
);
