import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import CafeImg from "./CafeImg.jsx";
import BeanRating from "../ui/BeanRating.jsx";
import { cn } from "../../lib/cn.js";

// List-style café row. `detail="address"` shows the full address (Profile); default shows area + rating (search).
function CompactCafeRow({ cafe, detail = "area", right, onNavigate, bordered = true }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-box p-2.5 transition-colors hover:bg-base-200/60",
        bordered && "border border-base-300 bg-surface",
      )}
    >
      <Link
        to={`/cafes/${cafe.id}`}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div className="size-12 shrink-0 overflow-hidden rounded-xl">
          <CafeImg cafe={cafe} compact />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-semibold">{cafe.name}</h3>
          <p className="flex items-center gap-1 text-[13px] text-secondary">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{detail === "address" ? cafe.address : cafe.area}</span>
          </p>
          {detail === "area" && <BeanRating value={cafe.rating} size={12} className="mt-0.5" />}
        </div>
      </Link>
      {right}
    </div>
  );
}

export default CompactCafeRow;
