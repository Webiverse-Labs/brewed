import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CafeCard from "./CafeCard.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { cn } from "../../lib/cn.js";

// px of slack so sub-pixel scroll positions don't leave an arrow showing at the very edge
const EDGE_SLACK = 4;

// Section title + horizontally scrolling cards. The row bleeds to the right edge, as in the design.
// Arrow buttons appear only on a side that still has cafés out of view.
function CafeRow({ title, cafes, seeAllTo }) {
  const titleId = useId();
  const scrollerId = useId();
  const scroller = useRef(null);
  const [more, setMore] = useState({ before: false, after: false });
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const before = el.scrollLeft > EDGE_SLACK;
    const after = el.scrollLeft < max - EDGE_SLACK;
    setMore((prev) => (prev.before === before && prev.after === after ? prev : { before, after }));
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    // card images/fonts settling or the layout changing width also changes what overflows
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [measure, cafes.length]);

  const scrollByPage = (direction) => {
    const el = scroller.current;
    if (!el) return;
    // most of a viewport per click, keeping the edge card partly visible for context
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.85, 240), behavior: reducedMotion ? "auto" : "smooth" });
  };

  const arrow = (direction) => {
    const next = direction > 0;
    const visible = next ? more.after : more.before;
    const Icon = next ? ChevronRight : ChevronLeft;
    return (
      <button
        type="button"
        aria-label={`Scroll ${title} ${next ? "right" : "left"}`}
        aria-controls={scrollerId}
        disabled={!visible}
        onClick={() => scrollByPage(direction)}
        className={cn(
          // vertically centred on the whole card (the -0.25rem offsets the scroller's pb-2)
          "absolute top-[calc(50%-0.25rem)] z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-base-300 bg-surface/90 text-primary shadow-soft backdrop-blur-sm",
          "transition-[opacity,visibility,scale,background-color] duration-200 hover:scale-105 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none",
          next ? "right-2" : "left-2",
          visible ? "visible opacity-100" : "invisible scale-90 opacity-0",
        )}
      >
        <Icon size={18} strokeWidth={2.25} />
      </button>
    );
  };

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="font-display text-xl font-medium">{title}</h2>
        {seeAllTo && (
          <Link to={seeAllTo} className="flex items-center gap-0.5 text-sm text-accent hover:underline">
            See all <ChevronRight size={14} />
          </Link>
        )}
      </div>
      <div className="relative">
        {arrow(-1)}
        <div
          id={scrollerId}
          ref={scroller}
          className="scrollbar-none -mr-5 flex snap-x gap-4 overflow-x-auto pr-5 pb-2 md:-mr-10 md:pr-10"
        >
          {cafes.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </div>
        {arrow(1)}
      </div>
    </section>
  );
}

export default CafeRow;
