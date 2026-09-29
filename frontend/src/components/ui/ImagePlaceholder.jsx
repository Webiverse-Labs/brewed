import CoffeeBean from "./CoffeeBean.jsx";
import { cn } from "../../lib/cn.js";

// Shown wherever a café has no photo. `compact` drops the caption for small thumbnails.
function ImagePlaceholder({ compact, className }) {
  return (
    <div className={cn("flex size-full flex-col items-center justify-center gap-2 bg-base-300 text-muted", className)}>
      <CoffeeBean size={compact ? 16 : 20} filled={false} />
      {!compact && <span className="text-xs">Cafe Photo Here</span>}
    </div>
  );
}

export default ImagePlaceholder;
