import SectionLabel from "../ui/SectionLabel.jsx";

function InfoCard({ title, children }) {
  return (
    <section className="rounded-box border border-base-300 bg-surface p-5">
      <SectionLabel className="mb-3">{title}</SectionLabel>
      {children}
    </section>
  );
}

export default InfoCard;
