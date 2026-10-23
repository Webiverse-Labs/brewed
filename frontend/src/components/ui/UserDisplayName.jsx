import EmailVerificationBadge from "./EmailVerificationBadge.jsx";
import { cn } from "../../lib/cn.js";

function UserDisplayName({ user, className }) {
  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-1.5 align-middle", className)}>
      <span className="truncate">{user.name}</span>
      <EmailVerificationBadge verified={user.emailVerified} iconOnly />
    </span>
  );
}

export default UserDisplayName;
