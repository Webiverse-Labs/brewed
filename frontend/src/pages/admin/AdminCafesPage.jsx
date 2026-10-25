import { useRef, useState } from "react";
import { Ban, ImagePlus, Pencil, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import AdminHeader from "../../components/admin/AdminHeader.jsx";
import DataTable from "../../components/admin/DataTable.jsx";
import CafeFields from "../../components/cafe/CafeFields.jsx";
import CafeLocationFields from "../../components/admin/CafeLocationFields.jsx";
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
import { assetUrl } from "../../lib/assetUrl.js";
import { useApi } from "../../hooks/useApi.js";
import { useDebounced } from "../../hooks/useDebounced.js";
import { useConfirmation } from "../../hooks/useConfirmation.js";

const columns = ["Café", "Location", "Rating", "Visits", "Actions"];

function AdminCafesPage() {
  const confirm = useConfirmation();
  const [query, setQuery] = useState("");
  const q = encodeURIComponent(useDebounced(query.trim()));
  const { data, loading, error, reload, setData } = useApi(`/admin/cafes?active=true&q=${q}`);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | café being edited
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const rows = (data?.cafes ?? []).filter((cafe) => cafe.active === true);
  const isNew = editing === "new";

  //d is null if a search failed while this request was in flight; the error view (with Retry) is showing then
  const replaceRow = (cafe) =>
    setData((d) => d && { ...d, cafes: d.cafes.map((c) => (c.id === cafe.id ? cafe : c)).filter((c) => c.active === true) });

  //bumps on every open, so a slow save can't close an editor that was opened after it started
  const editorSession = useRef(0);
  const openEditor = (target) => {
    editorSession.current += 1;
    setPhotos([]);
    setEditing(target);
  };

  const disableCafe = (cafe) => confirm({
    title: "Disable this café?",
    description: <>
      <strong className="text-base-content">{cafe.name}</strong>
      <p className="mt-3">This hides the café from discovery and moves it to Archive. Existing visit records will be kept. Enable it from Archive to return it to Café Management.</p>
    </>,
    confirmLabel: "Disable Café",
    pendingLabel: "Updating café…",
    danger: true,
    onConfirm: async () => {
      const { data: res } = await api.patch(`/admin/cafes/${cafe.id}`, { active: false });
      replaceRow(res.cafe);
      setViewing((current) => current?.id === cafe.id ? null : current);
      setEditing((current) => current?.id === cafe.id ? null : current);
      toast.success(`${cafe.name} disabled and moved to Archive.`);
    },
  });

  const save = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    //unchecked checkboxes are left out of FormData, so send the flag explicitly
    form.set("featured", String(form.has("featured")));
    photos.forEach((photo) => form.append("photos", photo));

    const session = editorSession.current;
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
      if (editorSession.current === session) setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const actions = (cafe) => (
    <div className="flex gap-1.5">
      <Button variant="ghost" size="sm" onClick={() => setViewing(cafe)}>
        View
      </Button>
      <Button variant="ghost" size="sm" onClick={() => openEditor(cafe)}>
        <Pencil size={14} /> Edit
      </Button>
      <Button variant="dangerSoft" size="sm" onClick={() => disableCafe(cafe)}>
        <Ban size={14} /> Disable
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
      </div>
    </div>
  );

  return (
    <>
      <AdminHeader title="Café Management" subtitle="Manage active cafés. Disabled cafés are in Archive.">
        <TextInput
          look="outlined"
          icon={Search}
          placeholder="Search cafés…"
          aria-label="Search cafés"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:w-64"
        />
        <Button to="/admin/archive?tab=cafes" variant="outline">Disabled Cafés</Button>
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
        emptyText={query.trim() ? "No active cafés match your search." : "No active cafés. Disabled cafés are in Archive."}
        renderRow={(cafe) => (
          <>
            <td>{nameCell(cafe, "size-10")}</td>
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

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title="Café details" size="sm">
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-medium">{viewing.name}</h2>
              <StatusBadge status={viewing.active ? "active" : "disabled"} className="mt-1" />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[15px]">
              {[
                ["Area", viewing.area || "—"],
                ["Address", viewing.address || "—"],
                ["Hours", viewing.hours || "—"],
                ["Description", viewing.description || "—"],
                ["Visits logged", viewing.visits ?? 0],
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
          </div>
        )}
      </Modal>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={isNew ? "Add New Café" : "Edit Café"} size="lg">
        <form onSubmit={save} className="flex flex-col gap-4">
          <CafeFields defaults={isNew ? {} : editing} />
          <CafeLocationFields key={isNew ? "new" : editing?.id} location={isNew ? null : editing?.location} />
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
