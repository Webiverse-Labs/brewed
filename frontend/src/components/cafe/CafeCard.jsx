import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import CafeImg from "./CafeImg.jsx";
import BookmarkBtn from "../ui/BookmarkBtn.jsx";
import BeanRating from "../ui/BeanRating.jsx";
import { cn } from "../../lib/cn.js";

// Fixed width + scroll snapping for horizontal rows; `fluid` lets the card fill a grid cell instead.
function CafeCard({ cafe, fluid = false }) {
  return (
    <Link
      to={`/cafes/${cafe.id}`}
      className={cn(
        "group overflow-hidden rounded-box border border-base-300 bg-surface transition-shadow hover:shadow-soft focus-visible:outline-2 focus-visible:outline-accent",
        fluid ? "w-full" : "w-60 shrink-0 snap-start",
      )}
    >
      <div className="relative h-40">
        <CafeImg cafe={cafe} />
        <BookmarkBtn cafeId={cafe.id} className="absolute top-3 right-3" />
      </div>
      <div className="flex flex-col gap-1 p-3.5">
        <h3 className="truncate font-display text-[15px] font-semibold">{cafe.name}</h3>
        <p className="flex items-center gap-1 text-[13px] text-secondary">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{cafe.area}</span>
        </p>
        <BeanRating value={cafe.rating} size={13} className="mt-1.5" />
      </div>
    </Link>
  );
}

export default CafeCard;
