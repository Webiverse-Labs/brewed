import { Link } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminPanel from "../../components/admin/AdminPanel.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { formatDate } from "../../lib/format.js";
import { useApi } from "../../hooks/useApi.js";

function AdminDashboardPage() {
  const { data, loading, error, reload } = useApi("/admin/stats");

  const header = <AdminHeader title="Dashboard" subtitle="Overview of the Brewed platform" />;
  if (loading && !data) return <>{header}<Loader /></>;
  if (error) return <>{header}<LoadError message={error} onRetry={reload} /></>;

  const { stats, recentSuggestions, recentUsers } = data;
  const cards = [
    { label: "Total Cafés", value: stats.cafes.toLocaleString(), delta: `+${stats.cafesThisWeek} this week` },
    { label: "Registered Users", value: stats.users.toLocaleString(), delta: `+${stats.usersThisWeek} this week` },
    {
      label: "Pending Suggestions",
      value: stats.pendingSuggestions.toLocaleString(),
      delta: stats.pendingSuggestions ? "Needs review" : "All caught up",
      highlight: stats.pendingSuggestions > 0,
    },
  ];

  return (
    <>
      {header}

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AdminPanel
          title="Recent Suggestions"
          action={
            <Link to="/admin/suggestions" className="text-sm text-accent hover:underline">
              View all
            </Link>
          }
        >
          {recentSuggestions.length === 0 && <p className="py-3 text-sm text-secondary">No suggestions yet.</p>}
          <ul className="divide-y divide-base-300">
            {recentSuggestions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{s.name}</p>
                  <p className="truncate text-[13px] text-secondary">
                    {s.submittedBy ? `@${s.submittedBy.username}` : "Deleted account"} · {formatDate(s.createdAt)}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel title="Recent Users">
          {recentUsers.length === 0 && <p className="py-3 text-sm text-secondary">No users yet.</p>}
          <ul className="divide-y divide-base-300">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium">{u.name}</p>
                  <p className="truncate text-[13px] text-secondary">@{u.username}</p>
                </div>
                <StatusBadge status={u.status} />
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    </>
  );
}

export default AdminDashboardPage;
