import { useEffect, useState } from "react";

// value, but only after it stops changing for `delay` ms — so search-as-you-type sends one request, not one per key
export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
