import { cn } from "../../lib/cn.js";

const tones = {
  accent: "bg-accent text-accent-content",
  secondary: "bg-secondary text-secondary-content",
  primary: "bg-primary text-primary-content",
  neutral: "bg-neutral-100 text-base-content",
};

const sizes = {
  "2xs": "size-5 text-[8px]",
  xs: "size-6 text-[9px]",
  sm: "size-8 text-[11px]",
  md: "size-10 text-sm",
  ml: "size-12 text-base",
  lg: "size-16 text-xl",
};

const initialsOf = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// `initials` overrides the derived ones (e.g. "??" for anonymous reviews).
function Avatar({ name = "", initials, tone = "accent", size = "md", src, className }) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold",
        tones[tone],
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : (initials ?? initialsOf(name))}
    </span>
  );
}

export default Avatar;
