function InfoRow({ icon: Icon, children }) {
  return (
    <p className="flex gap-2.5 text-[15px] leading-snug">
      <Icon size={16} className="mt-0.5 shrink-0 text-secondary" />
      <span>{children}</span>
    </p>
  );
}

export default InfoRow;
