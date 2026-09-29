// Page title + subtitle, with an optional toolbar (search, primary action) on the right.
function AdminHeader({ title, subtitle, children }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-[28px] leading-tight font-medium">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-secondary">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-col gap-3 sm:flex-row">{children}</div>}
    </header>
  );
}

export default AdminHeader;
