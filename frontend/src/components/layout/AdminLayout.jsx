import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AdminSidebar from "../admin/AdminSidebar.jsx";
import Logo from "../ui/Logo.jsx";

// Figma `AdminApp`: fixed sidebar from lg up, DaisyUI drawer below.
function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="admin-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(e) => setDrawerOpen(e.target.checked)}
      />

      <div className="drawer-content flex min-h-screen flex-col">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-base-300 bg-base-100/95 px-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="grid size-10 place-items-center rounded-full hover:bg-base-200"
          >
            <Menu size={20} />
          </button>
          <Logo />
          <span className="text-[11px] font-medium tracking-[0.12em] text-accent uppercase">Admin</span>
        </div>
        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="admin-drawer" aria-label="Close menu" className="drawer-overlay" />
        <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}

export default AdminLayout;
