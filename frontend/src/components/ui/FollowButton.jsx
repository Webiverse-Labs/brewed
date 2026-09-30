import { useState } from "react";
import toast from "react-hot-toast";
import Button from "./Button.jsx";
import api, { errorMessage } from "../../lib/api.js";

// Follow / unfollow a user. Starts from the server's `isFollowing` and updates optimistically.
function FollowButton({ userId, defaultFollowing = false, size = "sm" }) {
  const [following, setFollowing] = useState(defaultFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e.preventDefault();
    if (busy) return;
    const next = !following;
    setFollowing(next);
    setBusy(true);
    try {
      const { data } = next ? await api.post(`/users/${userId}/follow`) : await api.delete(`/users/${userId}/follow`);
      setFollowing(data.isFollowing);
    } catch (err) {
      setFollowing(!next);
      toast.error(errorMessage(err, "Couldn't update follow."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      shape="pill"
      variant={following ? "outline" : "primary"}
      aria-pressed={following}
      onClick={toggle}
      className="min-w-24"
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}

export default FollowButton;
