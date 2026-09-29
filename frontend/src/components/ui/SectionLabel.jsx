import { cn } from "../../lib/cn.js";

function SectionLabel({ as: Tag = "h2", className, children }) {
  return (
    <Tag className={cn("text-[13px] font-medium tracking-[0.08em] text-accent uppercase", className)}>{children}</Tag>
  );
}

export default SectionLabel;
