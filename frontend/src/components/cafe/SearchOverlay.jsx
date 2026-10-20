import { useEffect, useRef, useState } from "react";
import { Map, Search, X } from "lucide-react";
import CompactCafeRow from "./CompactCafeRow.jsx";
import BookmarkBtn from "../ui/BookmarkBtn.jsx";
import LoadError from "../ui/LoadError.jsx";
import Loader from "../ui/Loader.jsx";
import { useApi } from "../../hooks/useApi.js";
import { useDebounced } from "../../hooks/useDebounced.js";

// Live café search, opened from Home. Explore has its own map route.
function SearchOverlay({ open, onClose, onSuggest, onShowMap }) {
  if (!open) return null;
  return <SearchPanel onClose={onClose} onSuggest={onSuggest} onShowMap={onShowMap} />;
}

function SearchPanel({ onClose, onSuggest, onShowMap }) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    inputRef.current.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  // typing waits 250 ms before searching
  const q = encodeURIComponent(useDebounced(query.trim()));
  const search = useApi(`/cafes?q=${q}&limit=20`);
  const results = search.loading ? [] : search.data?.cafes ?? [];
  const empty = !search.loading && !search.error && results.length === 0;

  return (
    <dialog
      ref={dialogRef} role="dialog" aria-modal="true" aria-label="Search cafés"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 z-40 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-base-content outline-none backdrop:bg-primary/20"
    >
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0" />

      <div className="relative mx-auto flex h-full flex-col overflow-hidden bg-base-100 md:mt-[78px] md:h-auto md:max-h-[calc(100vh-110px)] md:w-[680px] md:rounded-3xl md:shadow-float">
        <div className="flex h-15 shrink-0 items-center gap-3 border-b border-base-300 px-5 md:px-6">
          <Search size={18} className="shrink-0 text-secondary" />
          <input
            autoFocus
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cafés by name, area, or type…"
            aria-label="Search"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="grid size-8 place-items-center rounded-full text-secondary hover:bg-base-200"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4">
          {search.loading && results.length === 0 && <Loader />}
          {search.error && <LoadError message={search.error} onRetry={search.reload} />}
          {empty && (
            <p className="px-3 py-10 text-center text-sm text-secondary">
              {query.trim() ? `No cafés match “${query.trim()}”.` : "No cafés yet."}
            </p>
          )}
          {results.map((cafe) => (
            <CompactCafeRow
              key={cafe.id}
              cafe={cafe}
              bordered={false}
              onNavigate={onClose}
              right={<BookmarkBtn cafeId={cafe.id} />}
            />
          ))}
        </div>

        <div className="shrink-0 border-t border-base-300 px-6 py-4 text-center text-sm">
          <button type="button" onClick={() => onShowMap(query.trim())} className="mx-auto mb-3 flex items-center gap-2 rounded-full px-3 py-1 font-medium hover:bg-base-200">
            <Map size={16} /> Explore on the map
          </button>
          <span className="text-secondary">Can't find your favorite café? </span>
          <button type="button" onClick={onSuggest} className="font-medium text-accent hover:underline">
            Suggest a café to be added to Brewed
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default SearchOverlay;
