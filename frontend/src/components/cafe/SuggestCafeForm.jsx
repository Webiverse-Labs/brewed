import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import CafeFields from "./CafeFields.jsx";
import Field from "../ui/Field.jsx";
import TextArea from "../ui/TextArea.jsx";
import DashedUpload from "../ui/DashedUpload.jsx";
import Button from "../ui/Button.jsx";

function SuggestCafeForm({ onDone }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO(api): POST /api/suggestions (multipart)
    toast.success("Thanks! Your suggestion was sent for review.");
    onDone?.();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <CafeFields />
      <Field label="Additional Notes">
        <TextArea name="notes" rows={2} placeholder="Anything else the team should know…" />
      </Field>
      <DashedUpload icon={Camera} label="Add a photo (optional)" name="photo" />
      <Button type="submit" block>
        Submit Suggestion
      </Button>
    </form>
  );
}

export default SuggestCafeForm;
