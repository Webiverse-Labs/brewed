import CoffeeBean from "./CoffeeBean.jsx";
import { cn } from "../../lib/cn.js";

function Logo({ size = "md", className }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-semibold", size === "lg" ? "text-xl" : "text-lg", className)}>
      <CoffeeBean size={size === "lg" ? 20 : 18} />
      Brewed
    </span>
  );
}

export default Logo;
