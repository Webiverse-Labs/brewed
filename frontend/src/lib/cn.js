// Joins class names, skipping falsy values: cn("a", cond && "b").
// No tailwind-merge — components expose variant/size props instead of relying on class overrides.
export const cn = (...classes) => classes.filter(Boolean).join(" ");
