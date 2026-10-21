import { Link } from "react-router-dom";
import { cn } from "../../lib/cn.js";

function Footer({ className }) {
  return (
    <footer className={cn("border-t border-base-300 px-5 py-4 text-[13px] text-secondary md:px-10", className)}>
      <div className="mx-auto flex max-w-[1024px] flex-col items-center justify-between gap-2 sm:flex-row sm:gap-4">
        <p>© 2026 Webiverse Labs. All rights reserved.</p>
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
