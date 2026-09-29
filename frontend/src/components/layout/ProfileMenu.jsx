import { Link } from "react-router-dom";
import { LogOut, Settings, UserRound } from "lucide-react";
import Avatar from "../ui/Avatar.jsx";
import { navBtnClass } from "./navStyles.js";
import { currentUser } from "../../data/mock.js";

// DaisyUI focus-based dropdown; blurring after a click closes it.
const closeMenu = () => document.activeElement?.blur();

function ProfileMenu({ active }) {
  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" aria-haspopup="menu" className={navBtnClass(active)}>
        <Avatar name={currentUser.name} tone={currentUser.tone} size="2xs" />
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
          <Link to="/login" onClick={closeMenu} className="text-error">
            <LogOut size={16} /> Log Out
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default ProfileMenu;
