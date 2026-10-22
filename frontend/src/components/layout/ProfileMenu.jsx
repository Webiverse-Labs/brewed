import { useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, UserRound } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { navBtnClass } from "./navStyles.js";
import { useAuth } from "../../hooks/useAuth.js";
import { cn } from "../../lib/cn.js";

// Native disclosure works with touch, mouse, and keyboard in both navigation bars.
function ProfileMenu({ active, mobile = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = useRef(null);
  const trigger = useRef(null);
  const closeMenu = useCallback(() => {
    if (menu.current) menu.current.open = false;
  }, []);

  useEffect(() => {
    const dismissOutside = (event) => {
      if (!menu.current?.contains(event.target)) closeMenu();
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    document.addEventListener("pointerdown", dismissOutside);
    desktop.addEventListener("change", closeMenu);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      desktop.removeEventListener("change", closeMenu);
    };
  }, [closeMenu]);

  const handleLogout = async () => {
    closeMenu();
    trigger.current?.focus();
    if (await logout()) navigate("/login");
  };

  return (
    <details
      ref={menu}
      className={cn("dropdown dropdown-end", mobile && "dropdown-top h-full")}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) closeMenu();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeMenu();
          trigger.current?.focus();
        }
      }}
    >
      <summary
        ref={trigger}
        className={cn(
          "list-none",
          mobile
            ? cn(
              "relative flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-[11px] transition-colors",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
              active ? "font-medium text-base-content" : "text-secondary",
            )
            : navBtnClass(active),
        )}
      >
        <Avatar name={user.name} src={user.avatarUrl} size="2xs" />
        Profile
      </summary>
      <ul
        aria-label="Profile options"
        className={cn(
          "dropdown-content menu z-10 w-48 rounded-box border border-base-300 bg-surface p-2 text-[15px] shadow-float",
          mobile ? "right-2 mb-3" : "mt-4",
        )}
      >
        <li>
          <Link to="/profile" onClick={closeMenu} className="min-h-11 content-center">
            <UserRound size={16} /> Profile
          </Link>
        </li>
        <li>
          <Link to="/settings" onClick={closeMenu} className="min-h-11 content-center">
            <Settings size={16} /> Settings
          </Link>
        </li>
        <li>
          <button type="button" onClick={handleLogout} className="min-h-11 content-center text-error">
            <LogOut size={16} /> Log Out
          </button>
        </li>
      </ul>
    </details>
  );
}

export default ProfileMenu;
