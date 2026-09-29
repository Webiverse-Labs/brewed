import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import BeanRating from "../ui/BeanRating.jsx";
import ImagePlaceholder from "../ui/ImagePlaceholder.jsx";
import { getCafe, getUser } from "../../data/mock.js";

// One diary entry / review. `heading="user"` on café pages, `"cafe"` on a profile's Logs tab.
function ReviewCard({ log, heading = "user" }) {
  const author = getUser(log.userId);
  const cafe = getCafe(log.cafeId);
  const anonymous = log.anonymous && heading === "user";

  return (
    <article className="rounded-box border border-base-300 bg-surface p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {heading === "user" &&
            (anonymous ? (
              <Avatar initials="??" tone="neutral" />
            ) : (
              <Avatar name={author.name} tone={author.tone} />
            ))}
          <div className="min-w-0">
            {heading === "user" ? (
              <p className="truncate font-display font-semibold">{anonymous ? "Anonymous" : author.name}</p>
            ) : (
              <Link to={`/cafes/${cafe.id}`} className="truncate font-display font-semibold hover:underline">
                {cafe.name}
              </Link>
            )}
            <p className="text-xs text-secondary">{log.date}</p>
          </div>
        </div>
        <BeanRating value={log.rating} size={14} className="shrink-0 pt-1" />
      </header>

      <p className="mt-3 text-[15px] leading-relaxed">{log.text}</p>

      {log.items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {log.items.map((item) => (
            <li key={item.name} className="flex items-center gap-2.5 rounded-full bg-base-200 px-3 py-1.5 text-[13px]">
              {item.name}
              <BeanRating value={item.rating} size={11} />
            </li>
          ))}
        </ul>
      )}

      {log.hasPhoto && (
        <div className="mt-3 h-44 overflow-hidden rounded-2xl">
          <ImagePlaceholder />
        </div>
      )}
    </article>
  );
}

export default ReviewCard;
