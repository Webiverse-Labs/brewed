import { Link } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import AdminPanel from "../../components/admin/AdminPanel.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { adminStats, getUser, suggestions, users } from "../../data/mock.js";

function AdminDashboardPage() {
  // TODO(api): GET /api/admin/stats
  return (
    <>
      <AdminHeader title="Dashboard" subtitle="Overview of the Brewed platform" />

      <div className="grid gap-4 sm:grid-cols-3">
        {adminStats.map((stat) => (
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
          <ul className="divide-y divide-base-300">
            {suggestions.slice(0, 3).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium">{s.name}</p>
                  <p className="truncate text-[13px] text-secondary">
                    @{getUser(s.submittedBy).username} · {s.date}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </AdminPanel>

        <AdminPanel title="Recent Users">
          <ul className="divide-y divide-base-300">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <Avatar name={u.name} tone={u.tone} size="sm" />
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
