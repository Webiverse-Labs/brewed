import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell, House, Map, Plus } from "lucide-react";
import Logo from "../ui/Logo.jsx";
import ProfileMenu from "./ProfileMenu.jsx";
import { navBtnClass } from "./navStyles.js";

// Desktop floating pill (md and up). Below md, MobileTabBar takes over.
function UserNavbar({ hasUnread }) {
  const { pathname } = useLocation();
  const profileActive = pathname.startsWith("/profile") || pathname.startsWith("/settings");

  const linkClass = ({ isActive }) => navBtnClass(isActive);

  return (
    <header className="fixed inset-x-0 top-4 z-50 hidden justify-center px-4 md:flex">
      <nav
        aria-label="Main"
        className="flex h-[54px] items-center gap-1 rounded-full border border-base-300 bg-base-100/90 px-2.5 shadow-soft backdrop-blur"
      >
        <Link to="/" className="mr-2 rounded-full px-3 focus-visible:outline-2 focus-visible:outline-accent" aria-label="Brewed home">
          <Logo />
        </Link>
        <NavLink to="/" end className={linkClass}>
          <House size={15} /> Home
        </NavLink>
        <NavLink to="/explore" className={linkClass}>
          <Map size={15} /> Explore
        </NavLink>
        <NavLink to="/log" className={linkClass}>
          <Plus size={15} /> Log a Visit
        </NavLink>
        <NavLink to="/notifications" className={linkClass}>
          <Bell size={15} /> Notifications
          {hasUnread && (
            <span className="absolute -top-0.5 right-0.5 size-1.5 rounded-full bg-accent" aria-label="unread" />
          )}
        </NavLink>
        <ProfileMenu active={profileActive} />
      </nav>
    </header>
  );
}

export default UserNavbar;
