import Cafe from "../models/Cafe.js";
import Follow from "../models/Follow.js";
import Log from "../models/Log.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { refreshCafeStats } from "../lib/cafeStats.js";
import { clearAuthCookie } from "../lib/generateToken.js";
import { notify } from "../lib/notify.js";
import { containsRegex, isObjectId, pick } from "../lib/queryHelpers.js";
import { mePayload, publicUser } from "../lib/userPayload.js";
import { fileUrl, removeUpload } from "../middlewares/uploadMiddleware.js";

//ids (as strings) among `userIds` that the viewer follows
async function followedIds(viewer, userIds) {
  if (!viewer) return new Set();
  const rows = await Follow.find({ follower: viewer._id, following: { $in: userIds } }).select("following");
  return new Set(rows.map((row) => String(row.following)));
}

async function findActiveUser(username) {
  const user = await User.findOne({ username: String(username).toLowerCase(), status: "active", role: "user" });
  if (!user) throw new ApiError(404, "User not found.");
  return user;
}

//owners see everything; others only see public, non-anonymous reviews (anonymous ones would reveal the author)
const visibleLogsFilter = (user, viewer) =>
  viewer?._id.equals(user._id) ? { user: user._id } : { user: user._id, type: "review", anonymous: false };

//GET /api/users?q= -> "Coffee Drinkers" search
export async function searchUsers(req, res) {
  const filter = { role: "user", status: "active" };
  if (req.query.q) {
    const re = containsRegex(req.query.q);
    filter.$or = [{ name: re }, { username: re }];
  }
  if (req.user) filter._id = { $ne: req.user._id };

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(20);
  const following = await followedIds(req.user, users.map((u) => u._id));
  res.json({ users: users.map((u) => ({ ...publicUser(u), isFollowing: following.has(String(u._id)) })) });
}

//GET /api/users/:username -> profile header (stats count only what the viewer is allowed to see)
export async function getProfile(req, res) {
  const user = await findActiveUser(req.params.username);
  const [stats] = await Log.aggregate([
    { $match: visibleLogsFilter(user, req.user) },
    { $group: { _id: null, visits: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
  ]);
  const following = await followedIds(req.user, [user._id]);

  res.json({
    user: {
      ...publicUser(user),
      visits: stats?.visits ?? 0,
      avgRating: stats ? Math.round(stats.avgRating * 10) / 10 : 0,
      isFollowing: following.has(String(user._id)),
      isMe: Boolean(req.user?._id.equals(user._id)),
    },
  });
}

//GET /api/users/:username/visited -> distinct cafés from the logs the viewer may see
export async function getVisited(req, res) {
  const user = await findActiveUser(req.params.username);
  const cafeIds = await Log.distinct("cafe", visibleLogsFilter(user, req.user));
  const cafes = await Cafe.find({ _id: { $in: cafeIds }, active: true }).sort({ name: 1 });
  res.json({ cafes });
}

//GET /api/users/:username/favorites
export async function getFavorites(req, res) {
  const user = await findActiveUser(req.params.username);
  const cafes = await Cafe.find({ _id: { $in: user.favorites }, active: true }).sort({ name: 1 });
  res.json({ cafes });
}

//GET /api/users/:username/logs -> diary entries only for the owner
export async function getUserLogs(req, res) {
  const user = await findActiveUser(req.params.username);
  const logs = await Log.find(visibleLogsFilter(user, req.user))
    .sort({ visitedAt: -1, createdAt: -1 })
    .limit(100)
    .populate("cafe", "name area address photos active");
  res.json({ logs });
}

//POST /api/users/:id/follow
export async function follow(req, res) {
  if (!isObjectId(req.params.id)) throw new ApiError(404, "User not found.");
  if (req.user._id.equals(req.params.id)) throw new ApiError(400, "You can't follow yourself.");

  const target = await User.findOne({ _id: req.params.id, status: "active", role: "user" });
  if (!target) throw new ApiError(404, "User not found.");

  //upsert keeps this idempotent; only notify when a new follow was actually created
  const result = await Follow.updateOne(
    { follower: req.user._id, following: target._id },
    { $setOnInsert: { follower: req.user._id, following: target._id } },
    { upsert: true },
  );
  if (result.upsertedCount) {
    await notify(target._id, { type: "follow", actor: req.user._id, message: `${req.user.name} started following you.` });
  }
  res.json({ isFollowing: true });
}

//DELETE /api/users/:id/follow
export async function unfollow(req, res) {
  if (!isObjectId(req.params.id)) throw new ApiError(404, "User not found.");
  await Follow.deleteOne({ follower: req.user._id, following: req.params.id });
  res.json({ isFollowing: false });
}

//PATCH /api/users/me { name?, username?, bio? }
export async function updateMe(req, res) {
  Object.assign(req.user, pick(req.body, ["name", "username", "bio"]));
  await req.user.save(); //runs schema validation; a taken username becomes a 409
  res.json({ user: await mePayload(req.user) });
}

//POST /api/users/me/avatar (multipart "avatar")
export async function updateAvatar(req, res) {
  if (!req.file) throw new ApiError(400, "Choose an image to upload.");
  const previous = req.user.avatarUrl;
  req.user.avatarUrl = fileUrl("avatars", req.file);
  await req.user.save();
  removeUpload(previous);
  res.json({ user: await mePayload(req.user) });
}

//PATCH /api/users/me/password { current, next }
export async function changePassword(req, res) {
  const { current, next } = req.body ?? {};
  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(current))) throw new ApiError(400, "Current password is incorrect.");
  user.password = String(next ?? "");
  await user.save(); //minlength is checked before hashing
  res.json({ message: "Password updated." });
}

//DELETE /api/users/me -> removes the account and everything tied to it
export async function deleteMe(req, res) {
  const userId = req.user._id;
  const affectedCafes = await Log.distinct("cafe", { user: userId });
  const photos = (await Log.find({ user: userId }).select("photos")).flatMap((log) => log.photos);

  await Promise.all([
    Log.deleteMany({ user: userId }),
    Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
    Notification.deleteMany({ $or: [{ user: userId }, { actor: userId }] }),
    User.deleteOne({ _id: userId }),
  ]);
  await Promise.all(affectedCafes.map(refreshCafeStats));
  [req.user.avatarUrl, ...photos].forEach(removeUpload);

  clearAuthCookie(res);
  res.status(204).end();
}
