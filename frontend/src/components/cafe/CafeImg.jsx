import ImagePlaceholder from "../ui/ImagePlaceholder.jsx";
import { assetUrl } from "../../lib/assetUrl.js";
import { cn } from "../../lib/cn.js";

// `cafe.photo` is the API's cover image (first of `photos`), an "/uploads/..." path.
function CafeImg({ cafe, compact, className }) {
  if (!cafe.photo) return <ImagePlaceholder compact={compact} className={className} />;
  return <img src={assetUrl(cafe.photo)} alt={cafe.name} className={cn("size-full object-cover", className)} />;
}

export default CafeImg;
