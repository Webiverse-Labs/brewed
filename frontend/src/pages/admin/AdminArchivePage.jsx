import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import SuggestionDetail from "../../components/admin/SuggestionDetail.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import BeanRating from "../../components/ui/BeanRating.jsx";
import Button from "../../components/ui/Button.jsx";
import EmailVerificationBadge from "../../components/ui/EmailVerificationBadge.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import Modal from "../../components/ui/Modal.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import UserDisplayName from "../../components/ui/UserDisplayName.jsx";
import api from "../../lib/api.js";
import { assetUrl } from "../../lib/assetUrl.js";
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
      setViewing((current) => current?.id === record.id ? null : current);
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
  const action = (record) => isSuggestion ? (
    <Button variant="outline" size="sm" onClick={() => setViewing(record)}>View</Button>
  ) : (
    <div className="flex gap-1.5">
      <Button variant="ghost" size="sm" onClick={() => setViewing(record)}>View</Button>
      <Button variant="outline" size="sm" onClick={() => restore(record)}>{isUser ? "Reinstate" : "Enable"}</Button>
    </div>
  );

  if (loading) return <Loader />;
  if (error) return <LoadError message={error} onRetry={reload} />;

  return (
    <>
      <DataTable
        columns={[isUser ? "User" : "Café", isUser ? "Email" : "Details", category.dateLabel, "Actions"]}
        rows={rows}
        emptyText={query ? "No archived records match your search." : category.empty}
        renderRow={(record) => <>
          <td>{name(record)}</td>
          <td className="text-secondary">{details(record)}</td>
          <td className="whitespace-nowrap">{date(record)}</td>
          <td>{action(record)}</td>
        </>}
        renderCard={(record) => <>
          {name(record)}
          <div className="mt-2 text-[13px] text-secondary">{details(record)}</div>
          <p className="mt-1 text-xs text-secondary">{category.dateLabel}: {date(record)}</p>
          <div className="mt-3">{action(record)}</div>
        </>}
      />
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={isSuggestion ? "Archived suggestion" : isUser ? "User details" : "Café details"}
        size={isSuggestion ? undefined : "sm"}
      >
        {viewing && (isSuggestion ? (
          <SuggestionDetail suggestion={viewing} bare />
        ) : isUser ? (
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
            <Button variant="outline" onClick={() => restore(viewing)} className="self-start">
              Reinstate user
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-medium">{viewing.name}</h2>
              <StatusBadge status="disabled" className="mt-1" />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[15px]">
              {[
                ["Area", viewing.area || "—"],
                ["Address", viewing.address || "—"],
                ["Hours", viewing.hours || "—"],
                ["Description", viewing.description || "—"],
                ["Visits logged", viewing.visits ?? 0],
                ["Last updated", formatDate(viewing.updatedAt) || "—"],
              ].map(([term, value]) => (
                <div key={term} className={term === "Address" || term === "Description" ? "col-span-2" : undefined}>
                  <dt className="text-xs font-semibold tracking-wide text-secondary uppercase">{term}</dt>
                  <dd className="mt-0.5">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs font-semibold tracking-wide text-secondary uppercase">Rating</dt>
                <dd className="mt-1"><BeanRating value={viewing.rating} size={12} /></dd>
              </div>
            </dl>
            {viewing.photo && (
              <img src={assetUrl(viewing.photo)} alt="" className="aspect-video w-full rounded-2xl object-cover" />
            )}
            <Button variant="outline" onClick={() => restore(viewing)} className="self-start">
              Enable café
            </Button>
          </div>
        ))}
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
