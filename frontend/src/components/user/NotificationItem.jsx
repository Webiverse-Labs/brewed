import { CircleAlert, MapPin, UserRound } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { cn } from "../../lib/cn.js";
import { timeAgo } from "../../lib/format.js";

//`follow` uses the actor's avatar; the icon is only a fallback if that account was deleted
const icons = { follow: UserRound, cafe_update: MapPin, system: CircleAlert };

function NotificationItem({ notification, onRead }) {
  const actor = notification.actor;
  const Icon = icons[notification.type];

  return (
    <button
      type="button"
      onClick={() => onRead(notification.id)}
      className={cn(
        "flex w-full items-center gap-4 rounded-box border p-4 text-left transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        notification.read ? "border-base-300 bg-surface hover:bg-base-200/40" : "border-accent/15 bg-unread",
      )}
    >
      {actor ? (
        <Avatar name={actor.name} src={actor.avatarUrl} />
      ) : (
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-secondary">
          <Icon size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[15px]">{notification.message}</span>
        <span className="mt-0.5 block text-xs text-secondary">{timeAgo(notification.createdAt)}</span>
      </span>
      {!notification.read && <span className="size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
    </button>
  );
}

export default NotificationItem;
