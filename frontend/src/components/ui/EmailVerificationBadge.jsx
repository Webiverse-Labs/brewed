import CoffeeBean from "./CoffeeBean.jsx";
import { cn } from "../../lib/cn.js";

function EmailVerificationBadge({ verified, iconOnly = false, className }) {
  const isVerified = verified === true;
  if (iconOnly && !isVerified) return null;

  return (
    <span
      className={cn(
        iconOnly
          ? "inline-flex size-5 shrink-0 items-center justify-center text-accent"
          : "badge badge-soft badge-sm whitespace-nowrap font-medium",
        !iconOnly && (isVerified ? "badge-success" : "badge-warning"),
        className,
      )}
      title={isVerified ? "Email address verified" : "Email address not verified"}
    >
      {isVerified && <CoffeeBean size={iconOnly ? 17 : 14} filled={false} />}
      <span className={iconOnly ? "sr-only" : undefined}>
        {iconOnly ? "Email verified" : isVerified ? "Verified" : "Unverified"}
      </span>
    </span>
  );
}

export default EmailVerificationBadge;
