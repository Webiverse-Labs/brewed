import { useState } from "react";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import CafeFields from "./CafeFields.jsx";
import Field from "../ui/Field.jsx";
import TextArea from "../ui/TextArea.jsx";
import DashedUpload from "../ui/DashedUpload.jsx";
import Button from "../ui/Button.jsx";
import api, { errorMessage } from "../../lib/api.js";

function SuggestCafeForm({ onDone }) {
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (photos[0]) form.set("photo", photos[0]);

    setSaving(true);
    try {
      await api.post("/suggestions", form);
      toast.success("Thanks! Your suggestion was sent for review.");
      onDone?.();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <CafeFields />
      <Field label="Additional Notes">
        <TextArea name="notes" rows={2} placeholder="Anything else the team should know…" />
      </Field>
      <DashedUpload icon={Camera} label="Add a photo (optional)" onChange={setPhotos} />
      <Button type="submit" block disabled={saving}>
        {saving ? "Sending…" : "Submit Suggestion"}
      </Button>
    </form>
  );
}

export default SuggestCafeForm;
