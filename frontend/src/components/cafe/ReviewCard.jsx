import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import BeanRating from "../ui/BeanRating.jsx";
import { assetUrl } from "../../lib/assetUrl.js";
import { formatDate } from "../../lib/format.js";

// One diary entry / review from the API.
// heading="user": café page — log.user is the author, or null for anonymous reviews.
// heading="cafe": a profile's Logs tab — log.cafe is the populated café.
function ReviewCard({ log, heading = "user" }) {
  const author = log.user;

  return (
    <article className="rounded-box border border-base-300 bg-surface p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {heading === "user" &&
            (author ? (
              <Avatar name={author.name} src={author.avatarUrl} />
            ) : (
              <Avatar initials="??" tone="neutral" />
            ))}
          <div className="min-w-0">
            {heading === "user" ? (
              author ? (
                <Link to={`/u/${author.username}`} className="block truncate font-display font-semibold hover:underline">
                  {author.name}
                </Link>
              ) : (
                <p className="truncate font-display font-semibold">Anonymous</p>
              )
            ) : (
              <Link to={`/cafes/${log.cafe.id}`} className="block truncate font-display font-semibold hover:underline">
                {log.cafe.name}
              </Link>
            )}
            <p className="text-xs text-secondary">{formatDate(log.visitedAt)}</p>
          </div>
        </div>
        <BeanRating value={log.rating} size={14} className="shrink-0 pt-1" />
      </header>

      {log.text && <p className="mt-3 text-[15px] leading-relaxed">{log.text}</p>}

      {log.items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {log.items.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex items-center gap-2.5 rounded-full bg-base-200 px-3 py-1.5 text-[13px]">
              {item.name}
              {item.rating > 0 && <BeanRating value={item.rating} size={11} />}
            </li>
          ))}
        </ul>
      )}

      {log.photos?.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {log.photos.map((photo) => (
            <img key={photo} src={assetUrl(photo)} alt="" className="aspect-square w-full rounded-2xl object-cover" />
          ))}
        </div>
      )}
    </article>
  );
}

export default ReviewCard;
