import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings, UserRound } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { navBtnClass } from "./navStyles.js";
import { useAuth } from "../../hooks/useAuth.js";

// DaisyUI focus-based dropdown; blurring after a click closes it.
const closeMenu = () => document.activeElement?.blur();

function ProfileMenu({ active }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    closeMenu();
    if (await logout()) navigate("/login");
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" aria-haspopup="menu" className={navBtnClass(active)}>
        <Avatar name={user.name} src={user.avatarUrl} size="2xs" />
        Profile
      </div>
      <ul
        tabIndex={-1}
        role="menu"
        className="dropdown-content menu z-10 mt-4 w-48 rounded-box border border-base-300 bg-surface p-2 text-[15px] shadow-float"
      >
        <li>
          <Link to="/profile" onClick={closeMenu}>
            <UserRound size={16} /> Profile
          </Link>
        </li>
        <li>
          <Link to="/settings" onClick={closeMenu}>
            <Settings size={16} /> Settings
          </Link>
        </li>
        <li>
          <button type="button" onClick={handleLogout} className="text-error">
            <LogOut size={16} /> Log Out
          </button>
        </li>
      </ul>
    </div>
  );
}

export default ProfileMenu;
