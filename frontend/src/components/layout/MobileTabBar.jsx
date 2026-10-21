import { NavLink, useLocation } from "react-router-dom";
import { Bell, House, Map, Plus } from "lucide-react";
import ProfileMenu from "./ProfileMenu.jsx";
import { cn } from "../../lib/cn.js";

const tabClass = (active) =>
  cn(
    "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
    active ? "font-medium text-base-content" : "text-secondary",
  );

// Bottom tab bar below md. Log a Visit is the dark center circle.
function MobileTabBar({ hasUnread }) {
  const { pathname } = useLocation();
  const profileActive = pathname.startsWith("/profile") || pathname.startsWith("/settings");
  const linkClass = ({ isActive }) => tabClass(isActive);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-base-300 bg-base-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        <NavLink to="/" end className={linkClass}>
          <House size={20} /> Home
        </NavLink>
        <NavLink to="/explore" className={linkClass}>
          <Map size={20} /> Explore
        </NavLink>
        <NavLink to="/log" aria-label="Log a Visit" className="grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-content shadow-soft">
            <Plus size={22} />
          </span>
        </NavLink>
        <NavLink to="/notifications" className={linkClass}>
          <span className="relative">
            <Bell size={20} />
            {hasUnread && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent" />}
          </span>
          Alerts
        </NavLink>
        <ProfileMenu active={profileActive} mobile />
      </div>
    </nav>
  );
}

export default MobileTabBar;
