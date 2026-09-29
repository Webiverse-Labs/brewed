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
import LoadError from "../../components/ui/LoadError.jsx";
import Loader from "../../components/ui/Loader.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useApi } from "../../hooks/useApi.js";
import { useDebounced } from "../../hooks/useDebounced.js";

const columns = ["Café", "Location", "Rating", "Visits", "Actions"];

function AdminCafesPage() {
  const [query, setQuery] = useState("");
  const q = encodeURIComponent(useDebounced(query.trim()));
  const { data, loading, error, reload, setData } = useApi(`/admin/cafes?q=${q}`);
  const [editing, setEditing] = useState(null); // null | "new" | café being edited
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const rows = data?.cafes ?? [];
  const isNew = editing === "new";

  const replaceRow = (cafe) => setData((d) => ({ ...d, cafes: d.cafes.map((c) => (c.id === cafe.id ? cafe : c)) }));

  const openEditor = (target) => {
    setPhotos([]);
    setEditing(target);
  };

  const toggleActive = async (cafe) => {
    try {
      const { data: res } = await api.patch(`/admin/cafes/${cafe.id}`, { active: !cafe.active });
      replaceRow(res.cafe);
      toast.success(`${cafe.name} ${res.cafe.active ? "enabled" : "disabled"}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    //unchecked checkboxes are left out of FormData, so send the flag explicitly
    form.set("featured", String(form.has("featured")));
    photos.forEach((photo) => form.append("photos", photo));

    setSaving(true);
    try {
      if (isNew) {
        await api.post("/admin/cafes", form);
        toast.success(`${form.get("name")} added.`);
        reload();
      } else {
        const { data: res } = await api.patch(`/admin/cafes/${editing.id}`, form);
        replaceRow(res.cafe);
        toast.success("Changes saved.");
      }
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const actions = (cafe) => (
    <div className="flex gap-1.5">
      <Button variant="ghost" size="sm" onClick={() => openEditor(cafe)}>
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
        <Button onClick={() => openEditor("new")}>
          <Plus size={16} /> Add New Café
        </Button>
      </AdminHeader>

      {loading && !data ? (
        <Loader />
      ) : error ? (
        <LoadError message={error} onRetry={reload} />
      ) : (
      <DataTable
        columns={columns}
        rows={rows}
        emptyText={query.trim() ? "No cafés match your search." : "No cafés yet."}
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
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={isNew ? "Add New Café" : "Edit Café"} size="lg">
        <form onSubmit={save} className="flex flex-col gap-4">
          <CafeFields defaults={isNew ? {} : editing} />
          <Field label="Tags" hint="Separate tags with commas">
            <TextInput name="tags" placeholder="Specialty, Micro-roastery…" defaultValue={isNew ? "" : editing?.tags.join(", ")} />
          </Field>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-box border border-base-300 bg-surface p-4">
            <span>
              <span className="block text-[15px] font-medium">Featured on Home</span>
              <span className="block text-[13px] text-secondary">Shows in the "Featured Cafés" row</span>
            </span>
            <input type="checkbox" name="featured" className="toggle toggle-primary" defaultChecked={!isNew && editing?.featured} />
          </label>
          <Field as="div" label="Photos" hint={isNew ? undefined : "New photos are added after the existing ones."}>
            <DashedUpload icon={ImagePlus} label="Click to upload photos" multiple onChange={setPhotos} />
          </Field>
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isNew ? "Add Café" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default AdminCafesPage;
