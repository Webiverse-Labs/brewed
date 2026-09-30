import Notification from "../models/Notification.js";

//what the logged-in user gets about themselves (GET /auth/me, login, settings updates)
export async function mePayload(user) {
  const unreadNotifications = await Notification.countDocuments({ user: user._id, read: false });
  return { ...user.toJSON(), unreadNotifications };
}

//what anyone can see about another user — no email, favorites or role
export function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}
