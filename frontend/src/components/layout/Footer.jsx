import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../../lib/cn.js";

const DEV_EMAIL = "webiverselabs@gmail.com";

async function copyDeveloperEmail() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(DEV_EMAIL);
    } else {
      const input = document.createElement("textarea");
      input.value = DEV_EMAIL;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      document.execCommand?.("copy");
      input.remove();
    }
    toast.success(`Copied ${DEV_EMAIL} to clipboard.`, { id: "copy-dev-email" });
  } catch {
    toast.error(`Couldn't copy email: ${DEV_EMAIL}`, { id: "copy-dev-email" });
  }
}

export function CopyDeveloperEmailButton() {
  return (
    <button
      type="button"
      onClick={copyDeveloperEmail}
      aria-label={`Copy developer team email ${DEV_EMAIL}`}
      title={`Copy ${DEV_EMAIL}`}
      className="inline-flex size-7 items-center justify-center rounded-full text-accent transition-colors hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <Mail size={15} />
    </button>
  );
}

function Footer({ className }) {
  return (
    <footer className={cn("border-t border-base-300 px-5 py-4 text-[13px] text-secondary md:px-10", className)}>
      <div className="mx-auto flex max-w-[1024px] flex-col items-center justify-between gap-2 sm:flex-row sm:gap-4">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
          <CopyDeveloperEmailButton />
          <span>© 2026 Webiverse Labs. All rights reserved.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/privacy" className="hover:text-base-content hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-base-content hover:underline">
            Terms & Conditions
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
