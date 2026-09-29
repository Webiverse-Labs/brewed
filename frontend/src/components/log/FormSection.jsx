import SectionLabel from "../ui/SectionLabel.jsx";

function FormSection({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>{title}</SectionLabel>
      {children}
    </section>
  );
}

export default FormSection;
