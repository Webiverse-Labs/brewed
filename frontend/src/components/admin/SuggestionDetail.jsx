import { Check, Lightbulb, X } from "lucide-react";
import Button from "../ui/Button.jsx";
import StatusBadge from "../ui/StatusBadge.jsx";
import { assetUrl } from "../../lib/assetUrl.js";
import { cn } from "../../lib/cn.js";
import { formatDate } from "../../lib/format.js";

// Side panel on desktop; `bare` drops the card chrome when shown inside a Modal on mobile.
function SuggestionDetail({ suggestion, onDecide, busy, bare }) {
  if (!suggestion) {
    return (
      <div className="grid min-h-64 place-items-center rounded-box border border-dashed border-base-300 p-6 text-center text-sm text-secondary">
        <div>
          <Lightbulb size={22} className="mx-auto mb-3" />
          Select a suggestion to view details
        </div>
      </div>
    );
  }

  const details = [
    ["Address", suggestion.address],
    ["Hours", suggestion.hours || "—"],
    ["Description", suggestion.description || "—"],
    ["Notes", suggestion.notes],
    ["Submitted by", suggestion.submittedBy ? `@${suggestion.submittedBy.username}` : "Deleted account"],
    ["Submitted on", formatDate(suggestion.createdAt)],
  ].filter(([, value]) => value);

  return (
    <div className={cn(!bare && "rounded-box border border-base-300 bg-surface p-5")}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-xl font-medium">{suggestion.name}</h2>
        <StatusBadge status={suggestion.status} className="mt-1" />
      </div>
      <dl className="mt-4 flex flex-col gap-3">
        {details.map(([term, value]) => (
          <div key={term}>
            <dt className="text-xs font-semibold tracking-wide text-secondary uppercase">{term}</dt>
            <dd className="mt-0.5 text-[15px]">{value}</dd>
          </div>
        ))}
      </dl>
      {suggestion.photo && (
        <img src={assetUrl(suggestion.photo)} alt="" className="mt-4 aspect-video w-full rounded-2xl object-cover" />
      )}
      {suggestion.status === "pending" && (
        <div className="mt-6 flex gap-3">
          <Button block disabled={busy} onClick={() => onDecide(suggestion, "approved")}>
            <Check size={16} /> Approve
          </Button>
          <Button block disabled={busy} variant="dangerSoft" onClick={() => onDecide(suggestion, "rejected")}>
            <X size={16} /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

export default SuggestionDetail;
