import { useState } from "react";
import { Bookmark } from "lucide-react";
import toast from "react-hot-toast";
import api, { errorMessage } from "../../lib/api.js";
import { cn } from "../../lib/cn.js";
import { useAuth } from "../../hooks/useAuth.js";

// Save / unsave a café. The saved state lives in the logged-in user's `favorites`, so every
// BookmarkBtn for the same café (cards, café page, search) stays in sync.
// `onDark` is the frosted version used on the café hero photo.
function BookmarkBtn({ cafeId, onDark, size = "md", className }) {
  const { user, updateUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const active = Boolean(user?.favorites?.includes(cafeId));

  const toggle = async (e) => {
    // Cards wrap this button in a <Link>; don't navigate when saving.
    e.preventDefault();
    e.stopPropagation();
    if (!user || busy) return;

    const previous = user.favorites;
    //optimistic: flip it now, then trust the server's list
    updateUser({ favorites: active ? previous.filter((id) => id !== cafeId) : [...previous, cafeId] });
    setBusy(true);
    try {
      const { data } = active ? await api.delete(`/cafes/${cafeId}/favorite`) : await api.post(`/cafes/${cafeId}/favorite`);
      updateUser({ favorites: data.favorites });
    } catch (err) {
      updateUser({ favorites: previous });
      toast.error(errorMessage(err, "Couldn't update your favorites."));
    } finally {
      setBusy(false);
    }
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
