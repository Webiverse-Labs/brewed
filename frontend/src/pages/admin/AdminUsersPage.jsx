import { useState } from "react";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import EmailVerificationBadge from "../../components/ui/EmailVerificationBadge.jsx";
import UserDisplayName from "../../components/ui/UserDisplayName.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import Modal from "../../components/ui/Modal.jsx";
import api from "../../lib/api.js";
import { formatDate, formatMonth } from "../../lib/format.js";
import { useApi } from "../../hooks/useApi.js";
import { useDebounced } from "../../hooks/useDebounced.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";

const columns = ["User", "Email", "Visits", "Joined", "Status", "Actions"];

function AdminUsersPage() {
  const confirm = useConfirmation();
  const [query, setQuery] = useState("");
  const q = encodeURIComponent(useDebounced(query.trim()));
  const { data, loading, error, reload, setData } = useApi(`/admin/users?status=active&q=${q}`);
  const [viewing, setViewing] = useState(null);

  const shown = (data?.users ?? []).filter((user) => user.status === "active");

  const suspendUser = (user) => {
    return confirm({
      title: "Suspend this user?",
      description: <>
        <strong className="text-base-content">{user.name} (@{user.username})</strong>
        <p className="mt-3">This user will lose account access and move to Archive. Their content will be kept. Reinstate them from Archive to return them to User Management.</p>
      </>,
      confirmLabel: "Suspend User",
      pendingLabel: "Updating account…",
      danger: true,
      onConfirm: async () => {
        await api.patch(`/admin/users/${user.id}`, { status: "suspended" });
        //d is null if a search failed while the suspension was being saved.
        setData((d) => d && { ...d, users: d.users.filter((u) => u.id !== user.id) });
        setViewing((v) => v?.id === user.id ? null : v);
        toast.success(`${user.name} suspended and moved to Archive.`);
      },
    });
  };

  const who = (user) => (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={user.name} src={user.avatarUrl} size="sm" />
      <div className="min-w-0">
        <p className="font-medium"><UserDisplayName user={user} /></p>
        <p className="truncate text-[13px] text-secondary">@{user.username}</p>
      </div>
    </div>
  );

  const actions = (user) => (
    <div className="flex gap-1.5">
      <Button variant="ghost" size="sm" onClick={() => setViewing(user)}>
        View
      </Button>
      <Button variant="dangerSoft" size="sm" onClick={() => suspendUser(user)}>
        Suspend
      </Button>
    </div>
  );

  return (
    <>
      <AdminHeader title="User Management" subtitle="Manage active accounts. Suspended accounts are in Archive.">
        <TextInput
          look="outlined"
          icon={Search}
          placeholder="Search users…"
          aria-label="Search users"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:w-64"
        />
        <Button to="/admin/archive?tab=users" variant="outline">Suspended Accounts</Button>
      </AdminHeader>

      {loading && !data ? (
        <Loader />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : (
      <DataTable
        columns={columns}
        rows={shown}
        emptyText={query.trim() ? "No active users match your search." : "No active accounts. Suspended accounts are in Archive."}
        renderRow={(user) => (
          <>
            <td>{who(user)}</td>
            <td className="text-secondary">{user.email}</td>
            <td>{user.visits}</td>
            <td className="whitespace-nowrap">{formatMonth(user.createdAt)}</td>
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
              {user.email} · {user.visits} visits · Joined {formatMonth(user.createdAt)}
            </p>
            <div className="mt-3">{actions(user)}</div>
          </>
        )}
      />
      )}

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title="User details" size="sm">
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} src={viewing.avatarUrl} size="ml" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-medium"><UserDisplayName user={viewing} /></p>
                <p className="truncate text-sm text-secondary">@{viewing.username}</p>
              </div>
              <StatusBadge status={viewing.status} />
            </div>
            {viewing.bio && <p className="text-[15px]">{viewing.bio}</p>}
            <dl className="grid grid-cols-2 gap-3 text-[15px]">
              {[
                ["Email", viewing.email],
                ["Visits logged", viewing.visits],
                ["Joined", formatDate(viewing.createdAt)],
              ].map(([term, value]) => (
                <div key={term} className={term === "Email" ? "col-span-2" : undefined}>
                  <dt className="text-xs font-semibold tracking-wide text-secondary uppercase">{term}</dt>
                  <dd className="mt-0.5 truncate">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs font-semibold tracking-wide text-secondary uppercase">Email verification</dt>
                <dd className="mt-0.5"><EmailVerificationBadge verified={viewing.emailVerified} /></dd>
              </div>
            </dl>
            <Button
              variant="dangerSoft"
              onClick={() => suspendUser(viewing)}
              className="self-start"
            >
              Suspend user
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

export default AdminUsersPage;
