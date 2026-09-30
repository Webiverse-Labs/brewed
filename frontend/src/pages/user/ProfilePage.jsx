import { useParams, useSearchParams } from "react-router-dom";
import { Settings } from "lucide-react";
import Page from "../../components/layout/Page.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import FollowButton from "../../components/ui/FollowButton.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import CompactCafeRow from "../../components/cafe/CompactCafeRow.jsx";
import ReviewCard from "../../components/cafe/ReviewCard.jsx";
import StatBlock from "../../components/user/StatBlock.jsx";
import NotFoundPage from "../NotFoundPage.jsx";
import { useApi } from "../../hooks/useApi.js";
import { useAuth } from "../../hooks/useAuth.js";

const tabs = [
  { value: "visited", label: "Visited" },
  { value: "favorites", label: "Favorites" },
  { value: "logs", label: "Logs" },
];

// Content of the selected tab; each tab is its own request.
// The API only returns diary entries (and anonymous reviews) to their owner.
function ProfileTab({ username, tab }) {
  const { data, loading, error, reload } = useApi(`/users/${username}/${tab}`);

  if (loading && !data) return <Loader />;
  if (error) return <LoadError message={error} onRetry={reload} />;

  if (tab !== "logs") {
    if (data.cafes.length === 0) {
      return <EmptyState>{tab === "visited" ? "No cafés visited yet." : "No favorite cafés yet."}</EmptyState>;
    }
    return (
      <div className="flex flex-col gap-2">
        {data.cafes.map((cafe) => (
          <CompactCafeRow key={cafe.id} cafe={cafe} detail="address" />
        ))}
      </div>
    );
  }

  if (data.logs.length === 0) return <EmptyState>No logs yet.</EmptyState>;
  const groups = [
    ["Published Review", data.logs.filter((l) => l.type === "review")],
    ["Personal Diary", data.logs.filter((l) => l.type === "diary")],
  ];
  return (
    <div className="flex flex-col gap-8">
      {groups.map(
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
  );
}

// /profile shows the signed-in user; /u/:username shows anyone.
function ProfilePage() {
  const { username: param } = useParams();
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const username = param ?? me.username;
  const { data, error, status, reload } = useApi(`/users/${username}`);
  const tab = tabs.some((t) => t.value === params.get("tab")) ? params.get("tab") : "visited";

  if (status === 404) return <NotFoundPage />;
  if (error) {
    return (
      <Page width="narrow">
        <LoadError message={error} onRetry={reload} />
      </Page>
    );
  }
  //also wait if a different profile is still loading, so old details never show under the new URL
  if (!data || data.user.username !== username.toLowerCase()) return <Loader fullScreen />;

  const { user } = data;

  return (
    <Page width="narrow">
      <header className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <Avatar name={user.name} src={user.avatarUrl} size="lg" />
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="truncate font-display text-2xl font-medium">{user.name}</h1>
            <p className="text-[15px] text-secondary">@{user.username}</p>
          </div>
          {user.isMe ? (
            <Button to="/settings" variant="outline" size="sm" shape="pill">
              <Settings size={15} /> Settings
            </Button>
          ) : (
            <FollowButton key={user.id} userId={user.id} defaultFollowing={user.isFollowing} />
          )}
        </div>
        {user.bio && <p className="text-[15px]">{user.bio}</p>}
        <div className="grid grid-cols-2 gap-3">
          <StatBlock value={user.visits} label={user.visits === 1 ? "Visit" : "Visits"} />
          <StatBlock value={user.visits ? user.avgRating.toFixed(1) : "—"} label="Avg. Rating" />
        </div>
      </header>

      <FilterTabs
        tabs={tabs}
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        label="Profile sections"
        className="mt-8 mb-5"
      />

      {/* key: each tab (and profile) gets a fresh loader; reusing one showed the last tab's data as this tab's and crashed */}
      <ProfileTab key={`${user.username}/${tab}`} username={user.username} tab={tab} />
    </Page>
  );
}

export default ProfilePage;
