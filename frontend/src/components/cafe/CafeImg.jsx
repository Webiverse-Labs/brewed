import ImagePlaceholder from "../ui/ImagePlaceholder.jsx";
import { cn } from "../../lib/cn.js";

function CafeImg({ cafe, compact, className }) {
  if (!cafe.photo) return <ImagePlaceholder compact={compact} className={className} />;
  return <img src={cafe.photo} alt={cafe.name} className={cn("size-full object-cover", className)} />;
}

export default CafeImg;
