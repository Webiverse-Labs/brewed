import { ChevronRight } from "lucide-react";
import CafeCard from "./CafeCard.jsx";

// Section title + horizontally scrolling cards. The row bleeds to the right edge, as in the design.
function CafeRow({ title, cafes, onSeeAll }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium">{title}</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="flex items-center gap-0.5 text-sm text-accent hover:underline"
        >
          See all <ChevronRight size={14} />
        </button>
      </div>
      <div className="scrollbar-none -mr-5 flex snap-x gap-4 overflow-x-auto pr-5 pb-2 md:-mr-10 md:pr-10">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </div>
    </section>
  );
}

export default CafeRow;
