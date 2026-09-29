import { useState } from "react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import SuggestionDetail from "../../components/admin/SuggestionDetail.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { formatDate } from "../../lib/format.js";
import { useApi } from "../../hooks/useApi.js";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";

const columns = ["Café Name", "Submitted By", "Date", "Status", "Actions"];

function AdminSuggestionsPage() {
  const { data, loading, error, reload, setData } = useApi("/admin/suggestions");
  const [selectedId, setSelectedId] = useState(null);
  const [deciding, setDeciding] = useState(false);
  const wide = useMediaQuery("(min-width: 1280px)");
  const rows = data?.suggestions ?? [];
  const selected = rows.find((s) => s.id === selectedId);

  //approving publishes the café and notifies the submitter (server side)
  const decide = async (suggestion, status) => {
    setDeciding(true);
    try {
      const { data: res } = await api.patch(`/admin/suggestions/${suggestion.id}`, { status });
      setData((d) => ({ ...d, suggestions: d.suggestions.map((s) => (s.id === suggestion.id ? res.suggestion : s)) }));
      toast.success(status === "approved" ? `${suggestion.name} approved and published.` : `${suggestion.name} rejected.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeciding(false);
    }
  };

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
      <AdminHeader title="Café Suggestions" subtitle="Review and action user-submitted café suggestions" />

      {loading && !data && <Loader />}
      {error && <LoadError message={error} onRetry={reload} />}
      {data && (
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No suggestions yet."
          selectedId={selectedId}
          onRowClick={(s) => setSelectedId(s.id)}
          renderRow={(s) => (
            <>
              <td className="font-medium whitespace-nowrap">{s.name}</td>
              <td className="text-secondary">{handle(s)}</td>
              <td className="whitespace-nowrap">{formatDate(s.createdAt)}</td>
              <td>
                <StatusBadge status={s.status} />
              </td>
              <td>{reviewAction(s)}</td>
            </>
          )}
          renderCard={(s) => (
            <button type="button" onClick={() => setSelectedId(s.id)} className="w-full text-left">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{s.name}</p>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-1 text-[13px] text-secondary">
                {handle(s)} · {formatDate(s.createdAt)}
              </p>
            </button>
          )}
        />

        {wide && (
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
