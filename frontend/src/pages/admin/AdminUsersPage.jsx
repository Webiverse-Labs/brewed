import { useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import { matches } from "../../lib/search.js";
import { users } from "../../data/mock.js";

const columns = ["User", "Email", "Visits", "Joined", "Status", "Actions"];

function AdminUsersPage() {
  // TODO(api): GET /api/admin/users?q=, PATCH /api/admin/users/:id { status }
  const [rows, setRows] = useState(users);
  const [query, setQuery] = useState("");

  const shown = rows.filter((u) => matches(query, u.name, u.username, u.email));

  const toggleSuspend = (user) => {
    const status = user.status === "active" ? "suspended" : "active";
    setRows((all) => all.map((u) => (u.id === user.id ? { ...u, status } : u)));
    toast.success(`${user.name} ${status === "suspended" ? "suspended" : "reinstated"}.`);
  };

  const who = (user) => (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={user.name} tone={user.tone} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-medium">{user.name}</p>
        <p className="truncate text-[13px] text-secondary">@{user.username}</p>
      </div>
    </div>
  );

  const actions = (user) => (
    <div className="flex gap-1.5">
      <Button variant="ghost" size="sm" to={`/u/${user.username}`}>
        View
      </Button>
      <Button variant={user.status === "active" ? "dangerSoft" : "outline"} size="sm" onClick={() => toggleSuspend(user)}>
        {user.status === "active" ? "Suspend" : "Reinstate"}
      </Button>
    </div>
  );

  return (
    <>
      <AdminHeader title="User Management" subtitle="View and moderate registered Brewed users">
        <TextInput
          look="outlined"
          icon={Search}
          placeholder="Search users…"
          aria-label="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:w-64"
        />
      </AdminHeader>

      <DataTable
        columns={columns}
        rows={shown}
        emptyText="No users match your search."
        renderRow={(user) => (
          <>
            <td>{who(user)}</td>
            <td className="text-secondary">{user.email}</td>
            <td>{user.visits}</td>
            <td className="whitespace-nowrap">{user.joined}</td>
            <td>
              <StatusBadge status={user.status} />
            </td>
            <td>{actions(user)}</td>
          </>
        )}
        renderCard={(user) => (
          <>
            <div className="flex items-start justify-between gap-3">
              {who(user)}
              <StatusBadge status={user.status} />
            </div>
            <p className="mt-2 truncate text-[13px] text-secondary">
              {user.email} · {user.visits} visits · Joined {user.joined}
            </p>
            <div className="mt-3">{actions(user)}</div>
          </>
        )}
      />
    </>
  );
}

export default AdminUsersPage;
