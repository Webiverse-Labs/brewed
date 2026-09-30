import { cn } from "../../lib/cn.js";

const widths = {
  full: "",
  medium: "max-w-[904px]",
  narrow: "max-w-[704px]", // 624px column + padding (Log a Visit, Notifications, Settings)
};

// Standard page padding. The desktop top padding clears the floating navbar.
function Page({ width = "full", className, children }) {
  return <div className={cn("mx-auto w-full px-5 pt-8 md:px-10 md:pt-24", widths[width], className)}>{children}</div>;
}

export default Page;
