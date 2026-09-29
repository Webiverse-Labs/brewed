function PageTitle({ title, subtitle, action }) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[28px] leading-tight font-medium md:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] text-secondary">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export default PageTitle;
