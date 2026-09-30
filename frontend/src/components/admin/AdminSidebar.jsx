import { Link, NavLink } from "react-router-dom";
import { Coffee, LayoutDashboard, Lightbulb, LogOut, Settings, Users } from "lucide-react";
import Logo from "../ui/Logo.jsx";
import { cn } from "../../lib/cn.js";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/cafes", label: "Cafés", icon: Coffee },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/suggestions", label: "Suggestions", icon: Lightbulb },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const itemClass = (active) =>
  cn(
    "flex h-10 items-center gap-3 rounded-field px-3 text-[15px] transition-colors",
    "focus-visible:outline-2 focus-visible:outline-accent",
    active ? "bg-primary text-primary-content" : "text-base-content hover:bg-base-200",
  );

function AdminSidebar({ onNavigate }) {
  return (
    <aside className="flex min-h-full w-56 flex-col border-r border-base-300 bg-surface">
      <div className="flex h-24 flex-col justify-center gap-1 px-6">
        <Logo />
        <span className="pl-[26px] text-[11px] font-medium tracking-[0.12em] text-accent uppercase">Admin</span>
      </div>

      <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={({ isActive }) => itemClass(isActive)}>
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-base-300 px-3 py-4">
        <Link to="/admin/login" className={itemClass(false)}>
          <LogOut size={17} />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;
