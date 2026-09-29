import { useParams, useSearchParams } from "react-router-dom";
import { Settings } from "lucide-react";
import Page from "../../components/layout/Page.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import FollowButton from "../../components/ui/FollowButton.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import CompactCafeRow from "../../components/cafe/CompactCafeRow.jsx";
import ReviewCard from "../../components/cafe/ReviewCard.jsx";
import StatBlock from "../../components/user/StatBlock.jsx";
import NotFoundPage from "../NotFoundPage.jsx";
import { currentUser, following, getCafe, getUserByUsername, logs } from "../../data/mock.js";

const tabs = [
  { value: "visited", label: "Visited" },
  { value: "favorites", label: "Favorites" },
  { value: "logs", label: "Logs" },
];

// /profile shows the signed-in user; /u/:username shows anyone (their diary entries stay private).
function ProfilePage() {
  const { username } = useParams();
  const [params, setParams] = useSearchParams();
  const user = username ? getUserByUsername(username) : currentUser;

  if (!user) return <NotFoundPage />;

  const isMe = user.id === currentUser.id;
  const tab = tabs.some((t) => t.value === params.get("tab")) ? params.get("tab") : "visited";

  // TODO(api): GET /api/users/:username/{visited,favorites,logs}
  const userLogs = logs.filter((l) => l.userId === user.id && (isMe || l.type === "review"));
  const visited = [...new Set(userLogs.map((l) => l.cafeId))].map(getCafe);
  const favorites = user.favorites.map(getCafe);
  const reviews = userLogs.filter((l) => l.type === "review");
  const diary = userLogs.filter((l) => l.type === "diary");

  const cafeList = (list, empty) =>
    list.length === 0 ? (
      <EmptyState>{empty}</EmptyState>
    ) : (
      <div className="flex flex-col gap-2">
        {list.map((cafe) => (
          <CompactCafeRow key={cafe.id} cafe={cafe} detail="address" />
        ))}
      </div>
    );

  return (
    <Page width="narrow">
      <header className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <Avatar name={user.name} tone={user.tone} size="lg" />
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="truncate font-display text-2xl font-medium">{user.name}</h1>
            <p className="text-[15px] text-secondary">@{user.username}</p>
          </div>
          {isMe ? (
            <Button to="/settings" variant="outline" size="sm" shape="pill">
              <Settings size={15} /> Settings
            </Button>
          ) : (
            <FollowButton defaultFollowing={following.includes(user.id)} />
          )}
        </div>
        <p className="text-[15px]">{user.bio}</p>
        <div className="grid grid-cols-2 gap-3">
          <StatBlock value={user.visits} label="Visits" />
          <StatBlock value={user.avgRating.toFixed(1)} label="Avg. Rating" />
        </div>
      </header>

      <FilterTabs
        tabs={tabs}
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        label="Profile sections"
        className="mt-8 mb-5"
      />

      {tab === "visited" && cafeList(visited, "No cafés visited yet.")}
      {tab === "favorites" && cafeList(favorites, "No favorite cafés yet.")}
      {tab === "logs" &&
        (userLogs.length === 0 ? (
          <EmptyState>No logs yet.</EmptyState>
        ) : (
          <div className="flex flex-col gap-8">
            {[
              ["Published Review", reviews],
              ["Personal Diary", diary],
            ].map(
              ([title, list]) =>
                list.length > 0 && (
                  <section key={title} className="flex flex-col gap-3">
                    <SectionLabel>{title}</SectionLabel>
                    {list.map((log) => (
                      <ReviewCard key={log.id} log={log} heading="cafe" />
                    ))}
                  </section>
                ),
            )}
          </div>
        ))}
    </Page>
  );
}

export default ProfilePage;
