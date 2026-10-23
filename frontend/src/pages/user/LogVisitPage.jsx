import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Calendar, Camera, Globe, Lock, MapPin, Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";
import Page from "../../components/layout/Page.jsx";
import PageTitle from "../../components/layout/PageTitle.jsx";
import FormSection from "../../components/log/FormSection.jsx";
import LogTypePicker from "../../components/log/LogTypePicker.jsx";
import CafePicker from "../../components/log/CafePicker.jsx";
import OrderItemEditor from "../../components/log/OrderItemEditor.jsx";
import CafeImg from "../../components/cafe/CafeImg.jsx";
import Field from "../../components/ui/Field.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import TextArea from "../../components/ui/TextArea.jsx";
import BeanRating from "../../components/ui/BeanRating.jsx";
import CoffeeBean from "../../components/ui/CoffeeBean.jsx";
import DashedUpload from "../../components/ui/DashedUpload.jsx";
import Button from "../../components/ui/Button.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { cn } from "../../lib/cn.js";

// Local YYYY-MM-DD ("en-CA" formats that way); toISOString() would give the UTC date.
const today = () => new Date().toLocaleDateString("en-CA");

function LogVisitPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { openSuggest } = useOutletContext();
  const [type, setType] = useState("review");
  //opened from a café page's "log a visit" button -> that café is pre-selected
  const [cafe, setCafe] = useState(state?.cafe ?? null);
  const [date, setDate] = useState(today());
  const [rating, setRating] = useState(0);
  const [items, setItems] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cafe) return toast.error("Choose the café you visited.");
    if (!rating) return toast.error("Give your visit an overall rating.");

    //multipart, because diary entries can carry photos; `items` travels as a JSON string
    const fields = new FormData(e.currentTarget);
    const form = new FormData();
    form.set("type", type);
    form.set("cafeId", cafe.id);
    form.set("visitedAt", fields.get("date") || date);
    form.set("rating", String(rating));
    form.set("text", fields.get("text") ?? "");
    form.set(
      "items",
      JSON.stringify(
        items.map(({ name, category, rating: itemRating, note }) => ({
          name,
          category,
          rating: itemRating,
          note,
        })),
      ),
    );
    if (type === "review") form.set("anonymous", String(anonymous));
    photos.forEach((photo) => form.append("photos", photo));

    setSubmitting(true);
    try {
      await api.post("/logs", form);
      navigate("/log/success", { state: { type } });
    } catch (err) {
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Page className="max-w-[704px] lg:max-w-[1100px]">
      <PageTitle
        title="Log a Visit"
        subtitle="Record your café experience and save it to your diary."
        action={
          <div className="hidden items-center gap-2 rounded-full border border-base-300 bg-surface px-3 py-1.5 text-xs text-secondary shadow-soft lg:flex">
            <Sparkles size={14} className="text-accent" />
            <span>Interactive Desktop View</span>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-9 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Main Form Column (Full width on mobile, 7/12 on desktop) */}
        <div className="flex flex-col gap-9 lg:col-span-7 xl:col-span-8 lg:gap-6">
          <FormSection
            title="What are you logging?"
            className="lg:rounded-2xl lg:border lg:border-base-300 lg:bg-surface lg:p-6 lg:shadow-soft"
          >
            <LogTypePicker value={type} onChange={setType} />
          </FormSection>

          <FormSection
            title="Where did you visit?"
            className="lg:rounded-2xl lg:border lg:border-base-300 lg:bg-surface lg:p-6 lg:shadow-soft"
          >
            <CafePicker value={cafe} onChange={setCafe} />
            <button
              type="button"
              onClick={openSuggest}
              className="mx-auto flex items-center gap-1.5 text-sm text-accent hover:underline lg:mx-0 lg:self-start"
            >
              <Plus size={14} /> Can't find your favorite café? Suggest it to be added.
            </button>
          </FormSection>

          <FormSection
            title="Visit details"
            className="lg:rounded-2xl lg:border lg:border-base-300 lg:bg-surface lg:p-6 lg:shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date Visited">
                <TextInput
                  look="outlined"
                  type="date"
                  name="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={today()}
                  required
                />
              </Field>
              <Field as="div" label="Overall Rating">
                <div className="flex h-11 items-center justify-between rounded-field border border-base-300 bg-surface px-4">
                  <BeanRating value={rating} onChange={setRating} size={20} label="Overall rating" />
                  {rating > 0 && <span className="text-xs font-semibold text-secondary">{rating} / 5</span>}
                </div>
              </Field>
            </div>
          </FormSection>

          <FormSection
            title="What did you order?"
            className="lg:rounded-2xl lg:border lg:border-base-300 lg:bg-surface lg:p-6 lg:shadow-soft"
          >
            <OrderItemEditor items={items} onChange={setItems} />
          </FormSection>

          <FormSection
            title="Written review"
            className="lg:rounded-2xl lg:border lg:border-base-300 lg:bg-surface lg:p-6 lg:shadow-soft"
          >
            <TextArea
              look="outlined"
              name="text"
              rows={5}
              placeholder="Describe your visit…"
              aria-label="Written review"
            />
            <DashedUpload icon={Camera} label="Click to upload photos" multiple onChange={setPhotos} />
            {type === "review" && (
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
            )}
          </FormSection>

          {/* Submit button on Mobile only (keeps identical single-column mobile interface) */}
          <div className="lg:hidden">
            <Button type="submit" block disabled={submitting}>
              {submitting ? "Saving…" : "Submit Log"}
            </Button>
          </div>
        </div>

        {/* Desktop Sticky Sidebar (Hidden on mobile, visible on desktop >= 1024px) */}
        <aside className="hidden flex-col gap-5 lg:sticky lg:top-24 lg:col-span-5 lg:flex xl:col-span-4">
          <div className="rounded-2xl border border-base-300 bg-surface p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-base-200 pb-4">
              <div>
                <h3 className="font-display text-lg font-medium">Visit Summary</h3>
                <p className="text-[13px] text-secondary">Live review of your entry</p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  type === "review"
                    ? anonymous
                      ? "bg-neutral-100 text-neutral"
                      : "bg-accent-soft text-accent"
                    : "bg-base-200 text-secondary",
                )}
              >
                {type === "review" ? <Globe size={13} /> : <Lock size={13} />}
                {type === "review" ? (anonymous ? "Anonymous" : "Public Review") : "Private Diary"}
              </span>
            </div>

            {/* Selected Café Display */}
            <div className="mt-4">
              {cafe ? (
                <div className="flex items-center gap-3 rounded-xl border border-base-200 bg-base-100/60 p-3">
                  <div className="size-12 shrink-0 overflow-hidden rounded-lg">
                    <CafeImg cafe={cafe} compact />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold">{cafe.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-secondary">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{cafe.area}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-base-300 p-3.5 text-secondary">
                  <CoffeeBean size={18} filled={false} className="shrink-0 text-muted" />
                  <p className="text-xs">Choose a café from the picker to link your visit</p>
                </div>
              )}
            </div>

            {/* Metadata Overview */}
            <div className="mt-4 flex flex-col gap-2.5 rounded-xl bg-base-100/60 p-3.5 text-xs text-secondary">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> Date Visited
                </span>
                <span className="font-medium text-base-content">{date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CoffeeBean size={13} /> Overall Rating
                </span>
                {rating > 0 ? (
                  <div className="flex items-center gap-1.5 font-medium text-base-content">
                    <BeanRating value={rating} size={13} />
                    <span>{rating}.0</span>
                  </div>
                ) : (
                  <span className="italic text-muted">Rating required</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UtensilsCrossed size={13} /> Orders
                </span>
                <span className="font-medium text-base-content">
                  {items.length === 0 ? "None added" : `${items.length} ${items.length === 1 ? "item" : "items"}`}
                </span>
              </div>
              {photos.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera size={13} /> Photos
                  </span>
                  <span className="font-medium text-base-content">
                    {photos.length} {photos.length === 1 ? "photo" : "photos"}
                  </span>
                </div>
              )}
            </div>

            {/* Ordered Items Preview Pills */}
            {items.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {items.map((item, idx) => (
                  <span
                    key={item.key || idx}
                    className="inline-flex items-center gap-1 rounded-md border border-base-300 bg-surface px-2 py-0.5 text-[11px] font-medium text-secondary"
                  >
                    <span>{item.name || item.category || "Item"}</span>
                    {item.rating > 0 && <span className="text-accent font-semibold">★{item.rating}</span>}
                  </span>
                ))}
              </div>
            )}

            {/* Desktop Submit Button */}
            <div className="mt-6">
              <Button type="submit" block disabled={submitting}>
                {submitting ? "Saving…" : "Submit Log"}
              </Button>
            </div>

            {/* Context Notice */}
            <p className="mt-4 text-center text-[12px] text-secondary leading-relaxed">
              {type === "review"
                ? "Public reviews help the Brewed community discover new favorite coffee spots."
                : "Personal diary entries remain private to your profile and visit history."}
            </p>
          </div>
        </aside>
      </form>
    </Page>
  );
}

export default LogVisitPage;
