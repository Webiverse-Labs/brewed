import { useRef, useState } from "react";
import CoffeeBean from "./CoffeeBean.jsx";
import { cn } from "../../lib/cn.js";

// Read-only by default; passing `onChange` turns it into a 1–5 input.
function BeanRating({ value = 0, onChange, size = 14, className, label = "Rating" }) {
  const [hover, setHover] = useState(0);
  const buttons = useRef([]);
  //only whole beans fill: an average of 4.5 shows 4 filled and an outline (docs/ui/components.md)
  const shown = Math.floor(hover || value);

  if (!onChange) {
    return (
      <div className={cn("flex items-center gap-1", className)} aria-label={`${label}: ${value} out of 5`} role="img">
        {[1, 2, 3, 4, 5].map((n) => (
          <CoffeeBean key={n} size={size} filled={n <= shown} />
        ))}
      </div>
    );
  }

  //ARIA radio group: Right/Down pick the next bean, Left/Up the previous, wrapping around,
  //and focus moves with the selection so Space re-selects the bean that has focus
  const handleKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = value ? ((value - 1 + step + 5) % 5) + 1 : step > 0 ? 1 : 5;
    onChange(next);
    buttons.current[next - 1]?.focus();
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
          ref={(el) => (buttons.current[n - 1] = el)}
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
