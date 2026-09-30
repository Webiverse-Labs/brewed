function EmptyState({ children }) {
  return (
    <p className="rounded-box border border-dashed border-base-300 px-6 py-12 text-center text-[15px] text-secondary">
      {children}
    </p>
  );
}

export default EmptyState;
