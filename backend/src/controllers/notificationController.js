import Notification, { NOTIFICATION_TYPES } from "../models/Notification.js";
import { ApiError } from "../lib/ApiError.js";
import { isObjectId } from "../lib/queryHelpers.js";
import { publicUser } from "../lib/userPayload.js";

//GET /api/notifications?type=follow|cafe_update|system -> newest first, plus the unread total
export async function listNotifications(req, res) {
  const filter = { user: req.user._id };
  if (NOTIFICATION_TYPES.includes(req.query.type)) filter.type = req.query.type;

  const [notifications, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50).populate("actor", "name username bio avatarUrl createdAt"),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.json({
    notifications: notifications.map((n) => ({ ...n.toJSON(), actor: publicUser(n.actor) })),
    unread,
  });
}

//PATCH /api/notifications/read-all
export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ unread: 0 });
}

//PATCH /api/notifications/:id/read
export async function markRead(req, res) {
  if (!isObjectId(req.params.id)) throw new ApiError(404, "Notification not found.");
  //scoped to req.user so nobody can mark someone else's notification
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ unread: await Notification.countDocuments({ user: req.user._id, read: false }) });
}
