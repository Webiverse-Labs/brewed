import { useState } from "react";
import { Archive } from "lucide-react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import SuggestionDetail from "../../components/admin/SuggestionDetail.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import api from "../../lib/api.js";
import { formatDate } from "../../lib/format.js";
import { useApi } from "../../hooks/useApi.js";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";

const columns = ["Café Name", "Submitted By", "Date", "Actions"];

function AdminSuggestionsPage() {
  const confirm = useConfirmation();
  const { data, loading, error, reload, setData } = useApi("/admin/suggestions?status=pending");
  const [selectedId, setSelectedId] = useState(null);
  const [deciding, setDeciding] = useState(false);
  const wide = useMediaQuery("(min-width: 1280px)");
  const rows = (data?.suggestions ?? []).filter((suggestion) => suggestion.status === "pending");
  const selected = rows.find((s) => s.id === selectedId);

  //approving publishes the café and notifies the submitter (server side)
  const decide = (suggestion, status) => confirm({
    title: status === "approved" ? "Approve and publish this café?" : "Reject this suggestion?",
    description: <>
      <strong className="text-base-content">{suggestion.name}</strong>
      <p className="mt-3">{status === "approved"
        ? "This publishes a new café listing and notifies the submitter if their account is available."
        : "This marks the suggestion as rejected and notifies the submitter if their account is available."}
        {" "}This decision cannot be changed here.</p>
    </>,
    confirmLabel: status === "approved" ? "Approve and Publish" : "Reject Suggestion",
    pendingLabel: "Saving decision…",
    danger: status === "rejected",
    onConfirm: async () => {
      setDeciding(true);
      try {
        await api.patch(`/admin/suggestions/${suggestion.id}`, { status });
        setData((d) => d && { ...d, suggestions: d.suggestions.filter((s) => s.id !== suggestion.id) });
        setSelectedId((id) => id === suggestion.id ? null : id);
        toast.success(status === "approved" ? `${suggestion.name} approved and published.` : `${suggestion.name} rejected.`);
      } finally {
        setDeciding(false);
      }
    },
  });

  const handle = (s) => (s.submittedBy ? `@${s.submittedBy.username}` : "Deleted account");
  const reviewAction = (s) =>
    s.status === "pending" ? (
      <Button variant="outline" size="sm" shape="pill" onClick={() => setSelectedId(s.id)}>
        Review
      </Button>
    ) : (
      <span className="text-secondary">—</span>
    );

  return (
    <>
      <AdminHeader title="Café Suggestions" subtitle="Review pending café suggestions. Completed decisions are saved in Archive.">
        <Button to="/admin/archive" variant="outline"><Archive size={16} /> View Archive</Button>
      </AdminHeader>

      {loading && !data && <Loader />}
      {error && <LoadError message={error} onRetry={reload} />}
      {data && !error && (
      <div className={`grid items-start gap-6 ${rows.length ? "xl:grid-cols-[1fr_320px]" : ""}`}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="All caught up. No pending suggestions. Approved and rejected suggestions are in Archive."
          selectedId={selectedId}
          onRowClick={(s) => setSelectedId(s.id)}
          renderRow={(s) => (
            <>
              <td className="font-medium whitespace-nowrap">{s.name}</td>
              <td className="text-secondary">{handle(s)}</td>
              <td className="whitespace-nowrap">{formatDate(s.createdAt)}</td>
              <td>{reviewAction(s)}</td>
            </>
          )}
          renderCard={(s) => (
            <button type="button" onClick={() => setSelectedId(s.id)} className="w-full text-left">
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-[13px] text-secondary">
                {handle(s)} · {formatDate(s.createdAt)}
              </p>
            </button>
          )}
        />

        {wide && rows.length > 0 && (
          <aside className="sticky top-8">
            <SuggestionDetail suggestion={selected} onDecide={decide} busy={deciding} />
          </aside>
        )}
      </div>
      )}

      <Modal open={!wide && Boolean(selected)} onClose={() => setSelectedId(null)} title="Suggestion details">
        <SuggestionDetail suggestion={selected} onDecide={decide} busy={deciding} bare />
      </Modal>
    </>
  );
}

export default AdminSuggestionsPage;
