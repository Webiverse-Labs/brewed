import { cn } from "../../lib/cn.js";

// Shared by UserNavbar items and the ProfileMenu trigger.
export const navBtnClass = (active) =>
  cn(
    "relative flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[15px] whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    active ? "bg-primary text-primary-content" : "text-base-content hover:bg-base-200",
  );
