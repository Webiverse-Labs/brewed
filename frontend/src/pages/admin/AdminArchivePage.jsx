import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import SuggestionDetail from "../../components/admin/SuggestionDetail.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Button from "../../components/ui/Button.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import Modal from "../../components/ui/Modal.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import UserDisplayName from "../../components/ui/UserDisplayName.jsx";
import api from "../../lib/api.js";
import { formatDate } from "../../lib/format.js";
import { useApi } from "../../hooks/useApi.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";
import { useDebounced } from "../../hooks/useDebounced.js";

const categories = [
  { value: "approved", label: "Approved cafés", collection: "suggestions", path: "/admin/suggestions?status=approved", dateLabel: "Reviewed", empty: "No approved café suggestions." },
  { value: "rejected", label: "Rejected cafés", collection: "suggestions", path: "/admin/suggestions?status=rejected", dateLabel: "Reviewed", empty: "No rejected café suggestions." },
  { value: "users", label: "Suspended accounts", collection: "users", path: "/admin/users?status=suspended", dateLabel: "Joined", empty: "No suspended accounts." },
  { value: "cafes", label: "Disabled cafés", collection: "cafes", path: "/admin/cafes?active=false", dateLabel: "Last updated", empty: "No disabled cafés." },
];

function ArchiveEntries({ category, query }) {
  const confirm = useConfirmation();
  const { data, loading, error, reload, setData } = useApi(`${category.path}&q=${encodeURIComponent(query)}`);
  const [viewing, setViewing] = useState(null);
  const isUser = category.collection === "users";
  const isSuggestion = category.collection === "suggestions";
  const rows = data?.[category.collection] ?? [];

  const restore = (record) => confirm({
    title: isUser ? "Reinstate this user?" : "Enable this café?",
    description: <>
      <strong className="text-base-content">{record.name}</strong>
      <p className="mt-3">{isUser
        ? "This restores the user's access to Brewed and returns them to User Management."
        : "This makes the café visible in discovery again and returns it to Café Management."}</p>
    </>,
    confirmLabel: isUser ? "Reinstate User" : "Enable Café",
    pendingLabel: "Restoring…",
    onConfirm: async () => {
      await api.patch(`/admin/${category.collection}/${record.id}`, isUser ? { status: "active" } : { active: true });
      setData((current) => current && {
        ...current,
        [category.collection]: current[category.collection].filter((row) => row.id !== record.id),
      });
      toast.success(`${record.name} ${isUser ? "reinstated" : "enabled"}.`);
    },
  });

  const name = (record) => isUser ? (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={record.name} src={record.avatarUrl} size="sm" />
      <div className="min-w-0">
        <p className="font-medium"><UserDisplayName user={record} /></p>
        <p className="truncate text-[13px] text-secondary">@{record.username}</p>
      </div>
    </div>
  ) : <span className="font-medium">{record.name}</span>;

  const details = (record) => isUser ? record.email : (
    <>
      <span className="block">{record.address || record.area}</span>
      {isSuggestion && <span className="mt-0.5 block text-xs">
        {record.submittedBy ? `Submitted by @${record.submittedBy.username}` : "Submitted by a deleted account"}
      </span>}
    </>
  );
  const date = (record) => formatDate(isSuggestion ? record.reviewedAt : isUser ? record.createdAt : record.updatedAt) || "—";
  const status = (record) => <StatusBadge status={category.collection === "cafes" ? "disabled" : record.status} />;
  const action = (record) => isSuggestion ? (
    <Button variant="outline" size="sm" onClick={() => setViewing(record)}>View</Button>
  ) : (
    <Button variant="outline" size="sm" onClick={() => restore(record)}>{isUser ? "Reinstate" : "Enable"}</Button>
  );

  if (loading) return <Loader />;
  if (error) return <LoadError message={error} onRetry={reload} />;

  return (
    <>
      <DataTable
        columns={[isUser ? "User" : "Café", isUser ? "Email" : "Details", category.dateLabel, "Status", "Actions"]}
        rows={rows}
        emptyText={query ? "No archived records match your search." : category.empty}
        renderRow={(record) => <>
          <td>{name(record)}</td>
          <td className="text-secondary">{details(record)}</td>
          <td className="whitespace-nowrap">{date(record)}</td>
          <td>{status(record)}</td>
          <td>{action(record)}</td>
        </>}
        renderCard={(record) => <>
          <div className="flex items-start justify-between gap-3">{name(record)}{status(record)}</div>
          <div className="mt-2 text-[13px] text-secondary">{details(record)}</div>
          <p className="mt-1 text-xs text-secondary">{category.dateLabel}: {date(record)}</p>
          <div className="mt-3">{action(record)}</div>
        </>}
      />
      <Modal open={viewing !== null} onClose={() => setViewing(null)} title="Archived suggestion">
        <SuggestionDetail suggestion={viewing} bare />
      </Modal>
    </>
  );
}

function AdminArchivePage() {
  const [params, setParams] = useSearchParams();
  const category = categories.find((tab) => tab.value === params.get("tab")) ?? categories[0];
  const [query, setQuery] = useState("");
  const search = useDebounced(query.trim());

  return (
    <>
      <AdminHeader title="Archive" subtitle="Reviewed suggestions, suspended accounts, and disabled cafés.">
        <TextInput
          look="outlined"
          icon={Search}
          placeholder="Search archive…"
          aria-label="Search archive"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="sm:w-64"
        />
        <Button to="/admin/suggestions" variant="outline">Pending Suggestions</Button>
      </AdminHeader>
      <FilterTabs tabs={categories} value={category.value} onChange={(tab) => setParams({ tab })} label="Archive categories" className="mb-6" />
      <ArchiveEntries key={`${category.value}:${search}`} category={category} query={search} />
    </>
  );
}

export default AdminArchivePage;
