import { useCallback, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import UserNavbar from "./UserNavbar.jsx";
import MobileTabBar from "./MobileTabBar.jsx";
import SearchOverlay from "../cafe/SearchOverlay.jsx";
import SuggestCafeForm from "../cafe/SuggestCafeForm.jsx";
import VerifyEmailBanner from "../user/VerifyEmailBanner.jsx";
import Modal from "../ui/Modal.jsx";
import { useAuth } from "../../hooks/useAuth.js";

// Signed-in shell. Pages reach the shared overlays through useOutletContext():
//   const { openSuggest, openSearch } = useOutletContext();
function UserLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const navigate = useNavigate();

  // Any navigation closes search. Reset during render, not in an effect,
  // so the new page never paints with the panel still on top
  const { key: locationKey } = useLocation();
  const [prevLocationKey, setPrevLocationKey] = useState(locationKey);
  if (locationKey !== prevLocationKey) {
    setPrevLocationKey(locationKey);
    setSearchOpen(false);
  }

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const showOnMap = useCallback((query) => {
    setSearchOpen(false);
    navigate(`/explore${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  }, [navigate]);
  const openSuggest = useCallback(() => {
    setSearchOpen(false);
    setSuggestOpen(true);
  }, []);

  const { user } = useAuth();
  const hasUnread = user.unreadNotifications > 0;

  return (
    <div className="min-h-screen">
      <UserNavbar hasUnread={hasUnread} />
      <main className="pb-28 md:pb-16">
        {user.emailVerified === false && <VerifyEmailBanner />}
        <Outlet context={{ openSuggest, openSearch }} />
      </main>
      <MobileTabBar hasUnread={hasUnread} />

      <SearchOverlay open={searchOpen} onClose={closeSearch} onSuggest={openSuggest} onShowMap={showOnMap} />
      <Modal open={suggestOpen} onClose={() => setSuggestOpen(false)} title="Suggest a Café">
        <SuggestCafeForm onDone={() => setSuggestOpen(false)} />
      </Modal>
    </div>
  );
}

export default UserLayout;
