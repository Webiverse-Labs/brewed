function AdminPanel({ title, action, children }) {
  return (
    <section className="rounded-box border border-base-300 bg-surface p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default AdminPanel;
