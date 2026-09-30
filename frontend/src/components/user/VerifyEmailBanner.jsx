import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MailWarning } from "lucide-react";
import Button from "../ui/Button.jsx";
import api, { errorMessage } from "../../lib/api.js";
import { useAuth } from "../../hooks/useAuth.js";

// Shown by UserLayout while the signed-in user's email is unverified (posting, suggesting and following are blocked).
function VerifyEmailBanner() {
  const { user, refresh } = useAuth();
  const [sending, setSending] = useState(false);

  // the emailed link usually opens in another tab: check again when the user comes back, so the banner clears itself
  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);

  const resend = async () => {
    setSending(true);
    try {
      const { data } = await api.post("/auth/resend-verification");
      toast.success(data.message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  // md:pt-24 / md:-mb-[4.5rem]: clear the floating navbar like <Page> does, then cancel most of the next
  // page's own md:pt-24 so the gap under the banner stays small
  return (
    <div className="mx-auto w-full max-w-[904px] px-5 pt-4 md:px-10 md:pt-24 md:-mb-[4.5rem]">
      <div
        role="status"
        className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="flex items-start gap-3 text-sm">
          <MailWarning size={18} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Verify your email to post reviews, suggest cafés and follow people. We sent a link to{" "}
            <strong className="font-medium break-all">{user.email}</strong>.
          </span>
        </p>
        <Button variant="outline" size="sm" shape="pill" onClick={resend} disabled={sending}>
          {sending ? "Sending…" : "Resend email"}
        </Button>
      </div>
    </div>
  );
}

export default VerifyEmailBanner;
