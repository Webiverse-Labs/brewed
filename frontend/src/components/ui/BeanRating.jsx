import { useState } from "react";
import CoffeeBean from "./CoffeeBean.jsx";
import { cn } from "../../lib/cn.js";

// Read-only by default; passing `onChange` turns it into a 1–5 input.
function BeanRating({ value = 0, onChange, size = 14, className, label = "Rating" }) {
  const [hover, setHover] = useState(0);
  const shown = Math.round(hover || value);

  if (!onChange) {
    return (
      <div className={cn("flex items-center gap-1", className)} aria-label={`${label}: ${value} out of 5`} role="img">
        {[1, 2, 3, 4, 5].map((n) => (
          <CoffeeBean key={n} size={size} filled={n <= shown} />
        ))}
      </div>
    );
  }

  const handleKey = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(Math.min(5, value + 1));
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(Math.max(1, value - 1));
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex items-center gap-1.5", className)}
      onMouseLeave={() => setHover(0)}
      onKeyDown={handleKey}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} bean${n > 1 ? "s" : ""}`}
          tabIndex={value === n || (!value && n === 1) ? 0 : -1}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="rounded-full p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent"
        >
          <CoffeeBean size={size} filled={n <= shown} />
        </button>
      ))}
    </div>
  );
}

export default BeanRating;
