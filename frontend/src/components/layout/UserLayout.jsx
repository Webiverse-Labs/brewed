import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import UserNavbar from "./UserNavbar.jsx";
import MobileTabBar from "./MobileTabBar.jsx";
import SearchOverlay from "../cafe/SearchOverlay.jsx";
import SuggestCafeForm from "../cafe/SuggestCafeForm.jsx";
import Modal from "../ui/Modal.jsx";
import { useAuth } from "../../hooks/useAuth.js";

// Signed-in shell. Pages reach the shared overlays through useOutletContext():
//   const { openSuggest, openExplore } = useOutletContext();
function UserLayout() {
  // Explore remembers the location it was opened on, so any navigation (navbar link, back button) closes it
  const { key: locationKey } = useLocation();
  const [exploreKey, setExploreKey] = useState(null);
  const exploreOpen = exploreKey === locationKey;
  const [suggestOpen, setSuggestOpen] = useState(false);

  const toggleExplore = useCallback(
    () => setExploreKey((k) => (k === locationKey ? null : locationKey)),
    [locationKey],
  );
  const openExplore = useCallback(() => setExploreKey(locationKey), [locationKey]);
  const closeExplore = useCallback(() => setExploreKey(null), []);
  const openSuggest = useCallback(() => {
    setExploreKey(null);
    setSuggestOpen(true);
  }, []);

  const { user } = useAuth();
  const hasUnread = user.unreadNotifications > 0;

  return (
    <div className="min-h-screen">
      <UserNavbar exploreOpen={exploreOpen} onExplore={toggleExplore} hasUnread={hasUnread} />
      <main className="pb-28 md:pb-16">
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
