import { useState } from "react";
import { Ban, ImagePlus, Pencil, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import CafeFields from "../../components/cafe/CafeFields.jsx";
import CafeImg from "../../components/cafe/CafeImg.jsx";
import BeanRating from "../../components/ui/BeanRating.jsx";
import Button from "../../components/ui/Button.jsx";
import DashedUpload from "../../components/ui/DashedUpload.jsx";
import Field from "../../components/ui/Field.jsx";
import Modal from "../../components/ui/Modal.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import { matches } from "../../lib/search.js";
import { cafes } from "../../data/mock.js";

const columns = ["Café", "Location", "Rating", "Visits", "Actions"];

function AdminCafesPage() {
  // TODO(api): GET /api/cafes?q=, POST /api/cafes, PATCH /api/cafes/:id
  const [rows, setRows] = useState(cafes);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null); // null | "new" | café being edited

  const shown = rows.filter((c) => matches(query, c.name, c.area));
  const isNew = editing === "new";

  const toggleActive = (cafe) => {
    setRows((all) => all.map((c) => (c.id === cafe.id ? { ...c, active: !c.active } : c)));
    toast.success(`${cafe.name} ${cafe.active ? "disabled" : "enabled"}.`);
  };

  const save = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const fields = {
      name: data.name,
      address: data.address,
      hours: data.hours,
      description: data.description,
      tags: data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (isNew) {
      const area = data.address.split(",").slice(-2).join(",").trim();
      setRows((all) => [
        { id: `new-${Date.now()}`, ...fields, area, rating: 0, visits: 0, active: true, photo: null },
        ...all,
      ]);
      toast.success(`${data.name} added.`);
    } else {
      setRows((all) => all.map((c) => (c.id === editing.id ? { ...c, ...fields } : c)));
      toast.success("Changes saved.");
    }
    setEditing(null);
  };

  const actions = (cafe) => (
    <div className="flex gap-1.5">
      <Button variant="ghost" size="sm" onClick={() => setEditing(cafe)}>
        <Pencil size={14} /> Edit
      </Button>
      <Button variant={cafe.active ? "dangerSoft" : "outline"} size="sm" onClick={() => toggleActive(cafe)}>
        {cafe.active ? (
          <>
            <Ban size={14} /> Disable
          </>
        ) : (
          "Enable"
        )}
      </Button>
    </div>
  );

  const nameCell = (cafe, thumb) => (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`${thumb} shrink-0 overflow-hidden rounded-lg`}>
        <CafeImg cafe={cafe} compact />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{cafe.name}</p>
        {!cafe.active && <StatusBadge status="disabled" className="mt-0.5" />}
      </div>
    </div>
  );

  return (
    <>
      <AdminHeader title="Café Management" subtitle="Browse, edit, and manage all cafés on Brewed">
        <TextInput
          look="outlined"
          icon={Search}
          placeholder="Search cafés…"
          aria-label="Search cafés"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:w-64"
        />
        <Button onClick={() => setEditing("new")}>
          <Plus size={16} /> Add New Café
        </Button>
      </AdminHeader>

      <DataTable
        columns={columns}
        rows={shown}
        emptyText="No cafés match your search."
        renderRow={(cafe) => (
          <>
            <td className={cafe.active ? "" : "opacity-60"}>{nameCell(cafe, "size-10")}</td>
            <td className="text-secondary">{cafe.area}</td>
            <td>
              <BeanRating value={cafe.rating} size={12} />
            </td>
            <td>{cafe.visits}</td>
            <td>{actions(cafe)}</td>
          </>
        )}
        renderCard={(cafe) => (
          <>
            {nameCell(cafe, "size-12")}
            <p className="mt-2 text-[13px] text-secondary">
              {cafe.area} · {cafe.visits} visits
            </p>
            <div className="mt-3">{actions(cafe)}</div>
          </>
        )}
      />

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={isNew ? "Add New Café" : "Edit Café"} size="lg">
        <form onSubmit={save} className="flex flex-col gap-4">
          <CafeFields defaults={isNew ? {} : editing} />
          <Field label="Tags" hint="Separate tags with commas">
            <TextInput name="tags" placeholder="Specialty, Micro-roastery…" defaultValue={isNew ? "" : editing?.tags.join(", ")} />
          </Field>
          <Field as="div" label="Photos">
            <DashedUpload icon={ImagePlus} label="Click to upload photos" multiple name="photos" />
          </Field>
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit">{isNew ? "Add Café" : "Save Changes"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default AdminCafesPage;
