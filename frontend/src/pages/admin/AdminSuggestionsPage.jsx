import { useState } from "react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import SuggestionDetail from "../../components/admin/SuggestionDetail.jsx";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import { getUser, suggestions } from "../../data/mock.js";

const columns = ["Café Name", "Submitted By", "Date", "Status", "Actions"];

function AdminSuggestionsPage() {
  // TODO(api): GET /api/suggestions, PATCH /api/suggestions/:id { status }
  const [rows, setRows] = useState(suggestions);
  const [selectedId, setSelectedId] = useState(null);
  const wide = useMediaQuery("(min-width: 1280px)");
  const selected = rows.find((s) => s.id === selectedId);

  const decide = (suggestion, status) => {
    setRows((all) => all.map((s) => (s.id === suggestion.id ? { ...s, status } : s)));
    toast.success(status === "approved" ? `${suggestion.name} approved and published.` : `${suggestion.name} rejected.`);
  };

  const handle = (s) => `@${getUser(s.submittedBy).username}`;
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

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
        <DataTable
          columns={columns}
          rows={rows}
          selectedId={selectedId}
          onRowClick={(s) => setSelectedId(s.id)}
          renderRow={(s) => (
            <>
              <td className="font-medium whitespace-nowrap">{s.name}</td>
              <td className="text-secondary">{handle(s)}</td>
              <td className="whitespace-nowrap">{s.date}</td>
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
                {handle(s)} · {s.date}
              </p>
            </button>
          )}
        />

        {wide && (
          <aside className="sticky top-8">
            <SuggestionDetail suggestion={selected} onDecide={decide} />
          </aside>
        )}
      </div>

      <Modal open={!wide && Boolean(selected)} onClose={() => setSelectedId(null)} title="Suggestion details">
        <SuggestionDetail suggestion={selected} onDecide={decide} bare />
      </Modal>
    </>
  );
}

export default AdminSuggestionsPage;
