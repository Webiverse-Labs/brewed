import { useState } from "react";
import { Search } from "lucide-react";
import TextInput from "../ui/TextInput.jsx";
import CafeImg from "../cafe/CafeImg.jsx";
import { useApi } from "../../hooks/useApi.js";
import { useDebounced } from "../../hooks/useDebounced.js";

// Search-as-you-type café picker. `value` is the chosen café object (from the API) or null.
function CafePicker({ value: selected, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const q = encodeURIComponent(useDebounced(query.trim()));
  //only search while the list is open and nothing is chosen
  const { data, loading } = useApi(open && !selected ? `/cafes?q=${q}&limit=6` : null);
  const results = data?.cafes ?? [];

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-field border border-base-300 bg-surface p-2 pr-4">
        <div className="size-10 shrink-0 overflow-hidden rounded-lg">
          <CafeImg cafe={selected} compact />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold">{selected.name}</p>
          <p className="truncate text-[13px] text-secondary">{selected.area}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-sm font-medium text-accent hover:underline">
          Change
        </button>
      </div>
    );
  }

  const pick = (cafe) => {
    onChange(cafe);
    setQuery("");
    setOpen(false);
  };

  return (
    //close only when focus leaves the whole picker, so Tab can move from the input into the results
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <TextInput
        look="outlined"
        icon={Search}
        placeholder="Search for a café…"
        aria-label="Search for a café"
        role="combobox"
        aria-expanded={open}
        aria-controls="cafe-picker-results"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (
        <ul
          id="cafe-picker-results"
          role="listbox"
          className="absolute inset-x-0 top-full z-10 mt-2 max-h-72 overflow-y-auto rounded-box border border-base-300 bg-surface p-1.5 shadow-float"
        >
          {loading && results.length === 0 && <li className="px-3 py-4 text-sm text-secondary">Searching…</li>}
          {!loading && results.length === 0 && (
            <li className="px-3 py-4 text-sm text-secondary">No cafés match “{query}”.</li>
          )}
          {results.map((cafe) => (
            <li key={cafe.id} role="option" aria-selected="false">
              <button
                type="button"
                // Keep focus in the input on click (Safari doesn't focus buttons, so the list would close first).
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(cafe)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-base-200"
              >
                <span className="size-10 shrink-0 overflow-hidden rounded-lg">
                  <CafeImg cafe={cafe} compact />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display font-semibold">{cafe.name}</span>
                  <span className="block truncate text-[13px] text-secondary">{cafe.area}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CafePicker;
