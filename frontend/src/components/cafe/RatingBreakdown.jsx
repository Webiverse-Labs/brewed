import BeanRating from "../ui/BeanRating.jsx";

function RatingBreakdown({ average, counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) return <p className="text-[15px] text-secondary">No ratings yet.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <span className="font-display text-4xl leading-none font-semibold">{average.toFixed(1)}</span>
        <BeanRating value={average} size={15} className="pb-1" />
      </div>
      <ul className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => (
          <li key={star} className="grid grid-cols-[12px_1fr_32px] items-center gap-2 text-xs text-secondary">
            <span>{star}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-base-200">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${(counts[star] / total) * 100}%` }} />
            </span>
            <span className="text-right">{counts[star]}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-secondary">
        Based on {total} {total === 1 ? "visit" : "visits"}
      </p>
    </div>
  );
}

export default RatingBreakdown;
