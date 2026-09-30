import { useState } from "react";
import Button from "./Button.jsx";

// UI-only phase: follow state is local.
function FollowButton({ defaultFollowing = false, size = "sm" }) {
  const [following, setFollowing] = useState(defaultFollowing);

  return (
    <Button
      size={size}
      shape="pill"
      variant={following ? "outline" : "primary"}
      aria-pressed={following}
      onClick={(e) => {
        e.preventDefault();
        setFollowing((f) => !f);
      }}
      className="min-w-24"
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}

export default FollowButton;
