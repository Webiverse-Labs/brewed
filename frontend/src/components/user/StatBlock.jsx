function StatBlock({ value, label }) {
  return (
    <div className="rounded-box border border-base-300 bg-surface px-4 py-3">
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-[13px] text-secondary">{label}</p>
    </div>
  );
}

export default StatBlock;
