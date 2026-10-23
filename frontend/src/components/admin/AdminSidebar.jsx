import { NavLink, useNavigate } from "react-router-dom";
import { Coffee, LayoutDashboard, Lightbulb, LogOut, PanelLeftClose, PanelLeftOpen, Settings, Users, X } from "lucide-react";
import Logo from "../ui/Logo.jsx";
import { cn } from "../../lib/cn.js";
import { useAuth } from "../../hooks/useAuth.js";

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/cafes", label: "Cafés", icon: Coffee },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/suggestions", label: "Suggestions", icon: Lightbulb },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const itemClass = (active, collapsed) =>
  cn(
    "flex h-10 items-center gap-3 rounded-field px-3 text-[15px] transition-colors",
    "focus-visible:outline-2 focus-visible:outline-accent",
    collapsed && "lg:justify-center lg:px-0",
    active ? "bg-primary text-primary-content" : "text-base-content hover:bg-base-200",
  );

function AdminSidebar({ collapsed = false, onToggle, onNavigate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    if (await logout()) navigate("/admin/login");
  };

  return (
    <aside
      id="admin-sidebar"
      className={cn(
        "flex min-h-full w-56 flex-col border-r border-base-300 bg-surface transition-[width] duration-200 motion-reduce:transition-none",
        collapsed && "lg:w-20",
      )}
    >
      <div className={cn("flex h-24 items-center justify-between gap-2 px-4", collapsed && "lg:justify-center lg:px-3")}>
        <div className={cn("flex flex-col gap-1", collapsed && "lg:hidden")}>
          <Logo />
          <span className="pl-[26px] text-[11px] font-medium tracking-[0.12em] text-accent uppercase">Admin</span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          aria-controls="admin-sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden size-10 shrink-0 place-items-center rounded-field hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-accent lg:grid"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close menu"
          className="grid size-10 shrink-0 place-items-center rounded-field hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-accent lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) => itemClass(isActive, collapsed)}
          >
            <Icon size={17} className="shrink-0" aria-hidden="true" />
            <span className={collapsed ? "lg:sr-only" : undefined}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-base-300 px-3 py-4">
        <button type="button" onClick={signOut} title={collapsed ? "Sign Out" : undefined} className={cn(itemClass(false, collapsed), "w-full")}>
          <LogOut size={17} className="shrink-0" aria-hidden="true" />
          <span className={collapsed ? "lg:sr-only" : undefined}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
