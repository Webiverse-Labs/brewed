import Cafe from "../models/Cafe.js";
import Log from "../models/Log.js";
import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { ratingCounts } from "../lib/cafeStats.js";
import { containsRegex } from "../lib/queryHelpers.js";
import { publicUser } from "../lib/userPayload.js";

const SORTS = {
  popular: { visits: -1, createdAt: -1 },
  rating: { rating: -1, visits: -1 },
  new: { createdAt: -1 },
};

//search across name, area and tags; shared with the admin café list
export function cafeSearchFilter(q) {
  if (!q) return {};
  const re = containsRegex(q);
  return { $or: [{ name: re }, { area: re }, { tags: re }] };
}

async function findActiveCafe(id) {
  const cafe = await Cafe.findOne({ _id: id, active: true });
  if (!cafe) throw new ApiError(404, "Café not found.");
  return cafe;
}

//a review as seen by the public: anonymous reviews hide who wrote them
export function publicLog(log) {
  const json = log.toJSON();
  json.user = log.anonymous ? null : publicUser(log.user);
  return json;
}

//GET /api/cafes?q=&sort=popular|rating|new&featured=true&limit=
export async function listCafes(req, res) {
  const { q, sort, featured, limit } = req.query;
  const filter = { active: true, ...cafeSearchFilter(q) };
  if (featured === "true") filter.featured = true;

  const cafes = await Cafe.find(filter)
    .sort(SORTS[sort] ?? SORTS.popular)
    .limit(Math.min(Number(limit) || 50, 100));
  res.json({ cafes });
}

//GET /api/cafes/:id -> café + rating breakdown + whether the viewer saved it
export async function getCafe(req, res) {
  const cafe = await findActiveCafe(req.params.id);
  res.json({
    cafe: {
      ...cafe.toJSON(),
      ratingCounts: await ratingCounts(cafe._id),
      isFavorite: Boolean(req.user?.favorites.some((id) => id.equals(cafe._id))),
    },
  });
}

//GET /api/cafes/:id/logs -> public reviews only (diary entries are private)
export async function getCafeLogs(req, res) {
  const cafe = await findActiveCafe(req.params.id);
  const logs = await Log.find({ cafe: cafe._id, type: "review" })
    .sort({ visitedAt: -1, createdAt: -1 })
    .limit(50)
    .populate("user", "name username bio avatarUrl createdAt");
  res.json({ logs: logs.map(publicLog) });
}

//POST /api/cafes/:id/favorite -> the viewer's updated favorites list
export async function addFavorite(req, res) {
  const cafe = await findActiveCafe(req.params.id);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { favorites: cafe._id } },
    { returnDocument: "after" },
  );
  res.json({ favorites: user.favorites });
}

//DELETE /api/cafes/:id/favorite (works even if the café was since disabled)
export async function removeFavorite(req, res) {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { favorites: req.params.id } },
    { returnDocument: "after" },
  );
  res.json({ favorites: user.favorites });
}
