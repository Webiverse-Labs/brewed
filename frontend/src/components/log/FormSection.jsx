import SectionLabel from "../ui/SectionLabel.jsx";
import { cn } from "../../lib/cn.js";

function FormSection({ title, className, children }) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </section>
  );
}

export default FormSection;
