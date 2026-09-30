import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import FollowButton from "../ui/FollowButton.jsx";

// A "Coffee Drinkers" search result; `user` comes from GET /users (includes isFollowing).
function SearchUserRow({ user, onNavigate }) {
  return (
    <div className="flex items-center gap-3.5 rounded-box p-2.5 transition-colors hover:bg-base-200/60">
      <Link
        to={`/u/${user.username}`}
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-xl focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Avatar name={user.name} src={user.avatarUrl} size="ml" />
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold">{user.name}</p>
          <p className="truncate text-[13px] text-secondary">
            @{user.username}
            {user.bio && ` · ${user.bio}`}
          </p>
        </div>
      </Link>
      <FollowButton userId={user.id} defaultFollowing={user.isFollowing} />
    </div>
  );
}

export default SearchUserRow;
