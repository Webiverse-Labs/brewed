import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "../../lib/cn.js";

// UI-only phase: the saved state is local to each button.
// `onDark` is the frosted version used on the café hero photo.
function BookmarkBtn({ defaultActive = false, onDark, size = "md", className }) {
  const [active, setActive] = useState(defaultActive);

  const toggle = (e) => {
    // Cards wrap this button in a <Link>; don't navigate when saving.
    e.preventDefault();
    e.stopPropagation();
    setActive((a) => !a);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        size === "lg" ? "size-10" : "size-8",
        active && "bg-accent text-accent-content",
        !active && (onDark ? "bg-white/25 text-white backdrop-blur hover:bg-white/35" : "bg-neutral-100 text-base-content hover:bg-base-300"),
        className,
      )}
    >
      <Bookmark size={size === "lg" ? 18 : 14} fill={active ? "currentColor" : "none"} />
    </button>
  );
}

export default BookmarkBtn;
