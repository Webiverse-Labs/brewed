import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Camera, Plus } from "lucide-react";
import toast from "react-hot-toast";
import Page from "../../components/layout/Page.jsx";
import PageTitle from "../../components/layout/PageTitle.jsx";
import FormSection from "../../components/log/FormSection.jsx";
import LogTypePicker from "../../components/log/LogTypePicker.jsx";
import CafePicker from "../../components/log/CafePicker.jsx";
import OrderItemEditor from "../../components/log/OrderItemEditor.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import TextArea from "../../components/ui/TextArea.jsx";
import BeanRating from "../../components/ui/BeanRating.jsx";
import DashedUpload from "../../components/ui/DashedUpload.jsx";
import Button from "../../components/ui/Button.jsx";

// Local YYYY-MM-DD ("en-CA" formats that way); toISOString() would give the UTC date.
const today = () => new Date().toLocaleDateString("en-CA");

function LogVisitPage() {
  const navigate = useNavigate();
  const { openSuggest } = useOutletContext();
  const [type, setType] = useState("review");
  const [cafeId, setCafeId] = useState(null);
  const [rating, setRating] = useState(0);
  const [items, setItems] = useState([]);
  const [anonymous, setAnonymous] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cafeId) return toast.error("Choose the café you visited.");
    if (!rating) return toast.error("Give your visit an overall rating.");
    // TODO(api): POST /api/logs (multipart) with { type, cafeId, rating, items, anonymous, ...form fields }
    navigate("/log/success", { state: { type } });
  };

  return (
    <Page width="narrow">
      <PageTitle title="Log a Visit" subtitle="Record your café experience and save it to your diary." />

      <form onSubmit={handleSubmit} className="flex flex-col gap-9">
        <FormSection title="What are you logging?">
          <LogTypePicker value={type} onChange={setType} />
        </FormSection>

        <FormSection title="Where did you visit?">
          <CafePicker value={cafeId} onChange={setCafeId} />
          <button
            type="button"
            onClick={openSuggest}
            className="mx-auto flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <Plus size={14} /> Can't find your café? Suggest it to be added.
          </button>
        </FormSection>

        <FormSection title="Visit details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date Visited">
              <TextInput look="outlined" type="date" name="date" defaultValue={today()} max={today()} required />
            </Field>
            <Field as="div" label="Overall Rating">
              <div className="flex h-11 items-center rounded-field border border-base-300 bg-surface px-4">
                <BeanRating value={rating} onChange={setRating} size={20} label="Overall rating" />
              </div>
            </Field>
          </div>
        </FormSection>

        <FormSection title="What did you order?">
          <OrderItemEditor items={items} onChange={setItems} />
        </FormSection>

        <FormSection title="Written review">
          <TextArea look="outlined" name="text" rows={5} placeholder="Describe your visit…" aria-label="Written review" />
          {type === "review" ? (
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-box border border-base-300 bg-surface p-4">
              <span>
                <span className="block text-[15px] font-medium">Post Anonymously</span>
                <span className="block text-[13px] text-secondary">Your name won't appear on this review</span>
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
            </label>
          ) : (
            <DashedUpload icon={Camera} label="Click to upload photos" multiple name="photos" />
          )}
        </FormSection>

        <Button type="submit" block>
          Submit Log
        </Button>
      </form>
    </Page>
  );
}

export default LogVisitPage;
