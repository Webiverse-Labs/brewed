import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserNavbar from "./UserNavbar.jsx";
import MobileTabBar from "./MobileTabBar.jsx";
import SearchOverlay from "../cafe/SearchOverlay.jsx";
import SuggestCafeForm from "../cafe/SuggestCafeForm.jsx";
import VerifyEmailBanner from "../user/VerifyEmailBanner.jsx";
import Modal from "../ui/Modal.jsx";
import { useAuth } from "../../hooks/useAuth.js";

// Signed-in shell. Pages reach the shared overlays through useOutletContext():
//   const { openSuggest, openExplore } = useOutletContext();
function UserLayout() {
  const [exploreOpen, setExploreOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  // any navigation (navbar link, back/forward) closes Explore. Reset during render, not in an effect,
  // so the new page never paints with the panel still on top
  const { key: locationKey } = useLocation();
  const [prevLocationKey, setPrevLocationKey] = useState(locationKey);
  if (locationKey !== prevLocationKey) {
    setPrevLocationKey(locationKey);
    setExploreOpen(false);
  }

  const toggleExplore = useCallback(() => setExploreOpen((o) => !o), []);
  const openExplore = useCallback(() => setExploreOpen(true), []);
  const closeExplore = useCallback(() => setExploreOpen(false), []);
  const openSuggest = useCallback(() => {
    setExploreOpen(false);
    setSuggestOpen(true);
  }, []);

  const { user } = useAuth();
  const hasUnread = user.unreadNotifications > 0;

  return (
    <div className="min-h-screen">
      <UserNavbar exploreOpen={exploreOpen} onExplore={toggleExplore} hasUnread={hasUnread} />
      <main className="pb-28 md:pb-16">
        {user.emailVerified === false && <VerifyEmailBanner />}
        <Outlet context={{ openSuggest, openExplore }} />
      </main>
      <MobileTabBar exploreOpen={exploreOpen} onExplore={toggleExplore} hasUnread={hasUnread} />

      <SearchOverlay open={exploreOpen} onClose={closeExplore} onSuggest={openSuggest} />
      <Modal open={suggestOpen} onClose={() => setSuggestOpen(false)} title="Suggest a Café">
        <SuggestCafeForm onDone={() => setSuggestOpen(false)} />
      </Modal>
    </div>
  );
}

export default UserLayout;
