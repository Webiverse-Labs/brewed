import { useState } from "react";
import { Camera, CircleCheck, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "../../components/ui/Avatar.jsx";
import BeanRating from "../../components/ui/BeanRating.jsx";
import BookmarkBtn from "../../components/ui/BookmarkBtn.jsx";
import Button from "../../components/ui/Button.jsx";
import DashedButton from "../../components/ui/DashedButton.jsx";
import DashedUpload from "../../components/ui/DashedUpload.jsx";
import Field from "../../components/ui/Field.jsx";
import FilterTabs from "../../components/ui/FilterTabs.jsx";
import FollowButton from "../../components/ui/FollowButton.jsx";
import ImagePlaceholder from "../../components/ui/ImagePlaceholder.jsx";
import Logo from "../../components/ui/Logo.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PasswordInput from "../../components/ui/PasswordInput.jsx";
import SectionLabel from "../../components/ui/SectionLabel.jsx";
import SegmentedControl from "../../components/ui/SegmentedControl.jsx";
import Select from "../../components/ui/Select.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import TextArea from "../../components/ui/TextArea.jsx";
import TextInput from "../../components/ui/TextInput.jsx";
import CafeCard from "../../components/cafe/CafeCard.jsx";
import CompactCafeRow from "../../components/cafe/CompactCafeRow.jsx";
import ReviewCard from "../../components/cafe/ReviewCard.jsx";
import StatCard from "../../components/admin/StatCard.jsx";
import { cafes, logs, stats } from "./fixtures.js";

function Block({ title, children }) {
  return (
    <section className="flex flex-col gap-4 border-t border-base-300 py-8">
      <SectionLabel>{title}</SectionLabel>
      {children}
    </section>
  );
}

// Dev-only kitchen sink (route exists only in `npm run dev`): every primitive in every state.
function UiKitPage() {
  const [rating, setRating] = useState(3);
  const [tab, setTab] = useState("all");
  const [mode, setMode] = useState("signup");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10">
      <Logo size="lg" />
      <h1 className="mt-4 font-display text-4xl font-medium">
        UI kit <em>preview</em>
      </h1>
      <p className="mt-2 text-secondary">
        Dev-only page. Compare against docs/ui/tokens.md and the Figma screenshots. Buttons that call the API
        (bookmark, follow) only work for real ids while logged in.
      </p>

      <Block title="Colors">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            ["base-100", "bg-base-100"],
            ["surface", "bg-surface"],
            ["base-200", "bg-base-200"],
            ["base-300", "bg-base-300"],
            ["primary", "bg-primary"],
            ["primary-soft", "bg-primary-soft"],
            ["accent", "bg-accent"],
            ["accent-soft", "bg-accent-soft"],
            ["unread", "bg-unread"],
            ["secondary", "bg-secondary"],
            ["muted", "bg-muted"],
            ["neutral-100", "bg-neutral-100"],
          ].map(([name, cls]) => (
            <div key={name} className="text-xs">
              <div className={`h-14 rounded-box border border-base-300 ${cls}`} />
              <p className="mt-1">{name}</p>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="accentSoft" shape="pill" size="sm">
            <CircleCheck size={15} /> Accent soft
          </Button>
          <Button variant="danger">Danger</Button>
          <Button variant="dangerSoft" size="sm" shape="pill">
            Danger soft
          </Button>
          <Button disabled>Disabled</Button>
          <Button shape="pill">Pill</Button>
          <FollowButton userId="fixture-user" />
          <FollowButton userId="fixture-user" defaultFollowing />
        </div>
      </Block>

      <Block title="Fields">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Filled">
            <TextInput placeholder="Ada Lovelace" />
          </Field>
          <Field label="Outlined with icon">
            <TextInput look="outlined" icon={Search} placeholder="Search for a café…" />
          </Field>
          <Field label="Password">
            <PasswordInput placeholder="Create a password" />
          </Field>
          <Field label="Select">
            <Select options={["Coffee", "Tea", "Pastry"]} />
          </Field>
          <Field label="Textarea" required hint="Hint text">
            <TextArea placeholder="Tell us about this café…" />
          </Field>
          <div className="flex flex-col gap-3">
            <DashedButton icon={Plus}>Add an item</DashedButton>
            <DashedUpload icon={Camera} label="Add a photo (optional)" multiple />
          </div>
        </div>
      </Block>

      <Block title="Ratings, tabs, badges">
        <div className="flex flex-wrap items-center gap-6">
          <BeanRating value={5} />
          <BeanRating value={4} />
          <BeanRating value={2} size={18} />
          <BeanRating value={rating} onChange={setRating} size={22} label="Try me" />
          <span className="text-sm text-secondary">interactive: {rating}</span>
        </div>
        <FilterTabs
          tabs={[
            { value: "all", label: "All" },
            { value: "cafe", label: "Café Updates" },
            { value: "system", label: "System" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <SegmentedControl
          className="max-w-xs"
          value={mode}
          onChange={setMode}
          options={[
            { value: "signup", label: "Sign Up" },
            { value: "login", label: "Log In" },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          {["pending", "approved", "rejected", "active", "suspended", "disabled"].map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </Block>

      <Block title="Avatars & bookmarks">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="Margot Chen" size="2xs" />
          <Avatar name="Margot Chen" size="xs" />
          <Avatar name="James Okafor" tone="secondary" size="sm" />
          <Avatar name="Sofia Reinholt" tone="primary" />
          <Avatar name="Tomás Vega" tone="neutral" size="ml" />
          <Avatar initials="??" tone="neutral" size="lg" />
          <BookmarkBtn cafeId={cafes[0].id} />
          <div className="rounded-box bg-primary p-3">
            <BookmarkBtn cafeId={cafes[1].id} onDark size="lg" />
          </div>
        </div>
      </Block>

      <Block title="Cards">
        <div className="flex flex-wrap gap-4">
          <CafeCard cafe={cafes[0]} />
          <CafeCard cafe={cafes[1]} />
          <div className="h-40 w-60 overflow-hidden rounded-box">
            <ImagePlaceholder />
          </div>
        </div>
        <CompactCafeRow cafe={cafes[2]} />
        <CompactCafeRow cafe={cafes[1]} detail="address" />
        <ReviewCard log={logs[0]} />
        <ReviewCard log={logs[1]} />
        <ReviewCard log={logs[0]} heading="cafe" />
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </Block>

      <Block title="Overlays">
        <div className="flex gap-3">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="outline" onClick={() => toast.success("Saved!")}>
            Success toast
          </Button>
          <Button variant="outline" onClick={() => toast.error("Something went wrong.")}>
            Error toast
          </Button>
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal title">
          <p className="text-[15px]">Esc, the × button and a backdrop click all close this.</p>
        </Modal>
      </Block>
    </div>
  );
}

export default UiKitPage;
