import { NavLink } from "react-router-dom";
import { Bell, House, Plus, Search } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { cn } from "../../lib/cn.js";
import { currentUser } from "../../data/mock.js";

const tabClass = (active) =>
  cn(
    "relative flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
    active ? "font-medium text-base-content" : "text-secondary",
  );

// Bottom tab bar below md. Log a Visit is the dark center circle.
function MobileTabBar({ exploreOpen, onExplore, hasUnread }) {
  const linkClass = ({ isActive }) => tabClass(isActive && !exploreOpen);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-base-300 bg-base-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        <NavLink to="/" end className={linkClass}>
          <House size={20} /> Home
        </NavLink>
        <button type="button" onClick={onExplore} aria-expanded={exploreOpen} className={tabClass(exploreOpen)}>
          <Search size={20} /> Explore
        </button>
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
        <NavLink to="/profile" className={linkClass}>
          <Avatar name={currentUser.name} tone={currentUser.tone} size="2xs" />
          Profile
        </NavLink>
      </div>
    </nav>
  );
}

export default MobileTabBar;
