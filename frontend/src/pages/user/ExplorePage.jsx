import { useCallback, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import Page from "../../components/layout/Page.jsx";
import CafeMap from "../../components/cafe/CafeMap.jsx";
import CafeImg from "../../components/cafe/CafeImg.jsx";
import BeanRating from "../../components/ui/BeanRating.jsx";
import BookmarkBtn from "../../components/ui/BookmarkBtn.jsx";
import Button from "../../components/ui/Button.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import { useApi } from "../../hooks/useApi.js";
import { useDebounced } from "../../hooks/useDebounced.js";
import { hasCafeLocation } from "../../lib/cafeLocations.js";
import { cn } from "../../lib/cn.js";

const EMPTY = [];

function ExplorePage() {
  const { openSuggest } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const q = encodeURIComponent(useDebounced(query.trim()));
  const { data, loading, error, reload } = useApi(`/cafes?q=${q}&limit=100`);
  const cafes = data?.cafes ?? EMPTY;
  const pinned = useMemo(() => cafes.filter(hasCafeLocation), [cafes]);
  const [selectedId, setSelectedId] = useState(null);
  const selectCafe = useCallback((id) => setSelectedId(id), []);
  const selected = cafes.find((cafe) => cafe.id === selectedId);
  const searching = loading || query.trim() !== decodeURIComponent(q);

  return (
    <Page>
      <p className="text-sm font-medium text-accent">A good cup, just around the corner</p>
      <div className="mt-1 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="font-display text-[36px] leading-tight font-medium md:text-[40px]">Explore cafés</h1>
        <TextInput
          icon={Search} type="search" aria-label="Filter cafés on map" placeholder="Search cafés by name, area, or type…"
          value={query} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })}
          className="w-full lg:w-[400px]"
        />
      </div>
      {searching && data && <p role="status" className="mt-4 text-sm text-secondary">Searching cafés…</p>}
      {error ? <div className="mt-8"><LoadError message={error} onRetry={reload} /></div> : loading && !data ? <Loader /> : (
        <div aria-busy={searching} className="mt-7 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <section aria-label="Cafés in Explore" className="flex flex-col rounded-3xl border border-base-300 bg-surface lg:max-h-[calc(100dvh-260px)] lg:min-h-[480px]">
            <div className="border-b border-base-300 px-5 py-4">
              <h2 className="font-display text-xl font-medium">{cafes.length} {cafes.length === 1 ? "café" : "cafés"} to discover</h2>
              <p className="mt-1 text-xs text-secondary">{pinned.length} on the map · Select a café or a pin</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {!cafes.length && <p role="status" className="px-3 py-8 text-center text-sm text-secondary">{query.trim() ? `No cafés match “${query.trim()}”.` : "No cafés yet."}</p>}
              {cafes.map((cafe) => (
                <div key={cafe.id} className={cn("rounded-2xl p-2 transition-colors", cafe.id === selectedId ? "bg-accent-soft" : "hover:bg-base-200/60")}>
                  <button type="button" aria-pressed={cafe.id === selectedId} onClick={() => selectCafe(cafe.id)} className="flex w-full items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-accent">
                    <div className="size-12 shrink-0 overflow-hidden rounded-xl"><CafeImg cafe={cafe} compact /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-[15px] font-semibold">{cafe.name}</h3>
                      <p className="mt-0.5 text-xs text-secondary">{cafe.area}</p>
                      <BeanRating value={cafe.rating} size={12} className="mt-1" />
                      {!hasCafeLocation(cafe) && <p className="mt-1 text-xs text-secondary">Location not yet pinned</p>}
                    </div>
                  </button>
                  <div className="mt-2 flex items-center justify-between pl-15">
                    <Link to={`/cafes/${cafe.id}`} className="text-xs font-medium text-accent hover:underline">View café</Link>
                    <BookmarkBtn cafeId={cafe.id} />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-base-300 p-4 text-center">
              <button type="button" onClick={openSuggest} className="text-sm font-medium text-accent hover:underline">Suggest a café</button>
            </div>
          </section>
          <div className="order-first flex min-w-0 flex-col gap-3 lg:order-last">
            <div className="h-[440px] lg:h-[calc(100dvh-260px)] lg:min-h-[480px]">
              <CafeMap cafes={pinned} selectedId={selectedId} onSelect={selectCafe} />
            </div>
            {selected && (
              <div aria-live="polite" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 bg-surface p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-medium">{selected.name}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-secondary"><MapPin size={15} className="mt-0.5 shrink-0" />{selected.address || selected.area}</p>
                </div>
                <Button to={`/cafes/${selected.id}`} size="sm">View café</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Page>
  );
}

export default ExplorePage;
