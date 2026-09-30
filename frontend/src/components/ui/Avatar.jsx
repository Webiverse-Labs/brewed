import { assetUrl } from "../../lib/assetUrl.js";
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

// same name -> same color everywhere, cycling through the three brand tones
const toneFor = (name) => {
  const palette = ["accent", "secondary", "primary"];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
};

// `initials` overrides the derived ones (e.g. "??" for anonymous reviews).
// `src` accepts an "/uploads/..." path from the API. `tone` defaults to one derived from the name.
function Avatar({ name = "", initials, tone, size = "md", src, className }) {
  const image = assetUrl(src);
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold",
        tones[tone ?? toneFor(name)],
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {image ? <img src={image} alt="" className="size-full object-cover" /> : (initials ?? initialsOf(name))}
    </span>
  );
}

export default Avatar;
