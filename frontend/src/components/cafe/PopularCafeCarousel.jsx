import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, MapPin } from "lucide-react";
import BookmarkBtn from "../ui/BookmarkBtn.jsx";
import BeanRating from "../ui/BeanRating.jsx";
import CoffeeBean from "../ui/CoffeeBean.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { assetUrl } from "../../lib/assetUrl.js";
import { cn } from "../../lib/cn.js";

const ROTATION_MS = 6000;

function PopularCafeCarousel({ cafes, onSeeAll }) {
  const titleId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [rotationCycle, setRotationCycle] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [failedPhoto, setFailedPhoto] = useState(null);
  const touchStart = useRef(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const index = Math.max(0, Math.min(activeIndex, cafes.length - 1));
  const rotating = playing && !hoverPaused && visible && !reducedMotion && cafes.length > 1;

  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => setActiveIndex((index + 1) % cafes.length), ROTATION_MS);
    return () => clearTimeout(timer);
  }, [rotating, index, cafes.length, rotationCycle]);

  const showSlide = (next) => {
    // Restart the full interval even when selecting the current dot while hovered or focused.
    setPlaying(true);
    setHoverPaused(false);
    setActiveIndex((next + cafes.length) % cafes.length);
    setRotationCycle((cycle) => cycle + 1);
  };

  if (!cafes.length) return null;
  const cafe = cafes[index];
  const hasPhoto = cafe.photo && cafe.photo !== failedPhoto;

  return (
    <section
      aria-labelledby={titleId} className="flex flex-col gap-4"
      onMouseEnter={() => setHoverPaused(true)} onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setPlaying(false)}
    >
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="font-display text-xl font-medium">Popular Cafés</h2>
        <button type="button" onClick={onSeeAll} className="flex items-center gap-0.5 text-sm text-accent hover:underline">
          See all <ChevronRight size={14} />
        </button>
      </div>
      <div
        role="region" aria-roledescription="carousel" aria-label="Popular cafés" tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || cafes.length < 2) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            showSlide(index + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
        onTouchStart={(event) => {
          touchStart.current = null;
          if (event.touches.length !== 1 || event.target.closest("a, button")) return;
          touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
          setPlaying(false);
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || !event.changedTouches.length || cafes.length < 2) return;
          const dx = event.changedTouches[0].clientX - start.x;
          const dy = event.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) showSlide(index + (dx < 0 ? 1 : -1));
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        className="relative isolate h-[400px] w-full overflow-hidden rounded-[28px] bg-primary text-white shadow-soft outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 sm:h-[450px]"
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_85%_25%,#9b6043_0%,#4b3025_42%,#2b1e1a_80%)]">
          <div className="absolute -top-24 -right-12 size-[450px] rounded-full border border-white/10 bg-white/5" />
          <div className="absolute top-18 right-12 size-64 rounded-full border border-white/10" />
          <CoffeeBean size={230} filled={false} className="absolute top-14 right-[9%] -rotate-25 text-[#edc5a3]/30" />
          <CoffeeBean size={100} filled={false} className="absolute right-[32%] bottom-4 rotate-12 text-[#edc5a3]/15" />
        </div>
        {hasPhoto && <img key={`photo-${cafe.id}`} src={assetUrl(cafe.photo)} alt="" onError={() => setFailedPhoto(cafe.photo)} className="cafe-banner-photo-enter absolute inset-0 size-full object-cover" />}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/95 via-primary/75 to-primary/10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent" />

        <div aria-live={rotating ? "off" : "polite"} aria-atomic="true" className="h-full">
          <article key={cafe.id} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${cafes.length}: ${cafe.name}`} className="cafe-banner-enter relative flex h-full flex-col items-start justify-center px-6 pt-10 pb-24 sm:px-10 lg:px-14">
            <h3 title={cafe.name} className="line-clamp-2 max-w-full shrink-0 text-balance font-display text-[32px] leading-[1.1] font-medium sm:text-[44px] lg:max-w-2xl lg:text-[52px]">{cafe.name}</h3>
            {(cafe.area || cafe.address) && <p className="mt-3 flex max-w-full shrink-0 items-center gap-2 text-sm text-white/85 lg:max-w-xl"><MapPin size={16} className="shrink-0" /><span className="truncate">{cafe.area || cafe.address}</span></p>}
            {cafe.description && <p className="mt-4 hidden max-w-lg shrink-0 text-sm leading-relaxed text-white/75 sm:line-clamp-2 sm:text-[15px]">{cafe.description}</p>}
            {cafe.rating > 0 && <div className="mt-4 flex items-center gap-2 text-white/90"><BeanRating value={cafe.rating} size={15} /><span className="text-sm">{cafe.rating.toFixed(1)}</span></div>}
            <Link to={`/cafes/${cafe.id}`} aria-label={`View ${cafe.name}`} className="mt-6 inline-flex h-11 shrink-0 items-center gap-3 rounded-full bg-white px-5 text-sm font-semibold text-primary transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              View café <ArrowUpRight size={17} />
            </Link>
          </article>
        </div>
        <BookmarkBtn key={cafe.id} cafeId={cafe.id} onDark size="lg" className="absolute top-5 right-5 z-10" />

        {cafes.length > 1 && (
          <p aria-hidden="true" className="absolute right-6 bottom-5 text-sm tabular-nums text-white/60 sm:right-10 lg:right-14"><span className="font-medium text-white">{String(index + 1).padStart(2, "0")}</span><span className="mx-2">/</span>{String(cafes.length).padStart(2, "0")}</p>
        )}
      </div>
      {cafes.length > 1 && (
        <div role="group" aria-label="Choose a popular café" className="-mt-2 flex flex-wrap items-center justify-center">
          {cafes.map((item, position) => <button key={item.id} type="button" aria-label={`Show ${item.name} (${position + 1} of ${cafes.length})`} aria-current={position === index ? "true" : undefined} onClick={() => showSlide(position)} className="group grid size-6 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-accent"><span className={cn("size-1.5 rounded-full transition-colors motion-reduce:transition-none", position === index ? "bg-accent" : "bg-base-300 group-hover:bg-secondary")} /></button>)}
        </div>
      )}
    </section>
  );
}

export default PopularCafeCarousel;
