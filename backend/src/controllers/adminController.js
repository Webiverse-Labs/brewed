import Cafe from "../models/Cafe.js";
import Log from "../models/Log.js";
import Suggestion from "../models/Suggestion.js";
import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { setAuthCookie } from "../lib/generateToken.js";
import { notify, notifyMany } from "../lib/notify.js";
import { areaFromAddress, containsRegex, isObjectId, parseTags, pick, toBool } from "../lib/queryHelpers.js";
import { mePayload, publicUser } from "../lib/userPayload.js";
import { discardUploads, fileUrl } from "../middlewares/uploadMiddleware.js";
import { verifyCredentials } from "./authController.js";
import { cafeSearchFilter } from "./cafeController.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

//suggestion + who sent it (submittedBy is null if that account was deleted)
const suggestionJSON = (s) => ({ ...s.toJSON(), submittedBy: publicUser(s.submittedBy) });

async function findById(Model, id, label) {
  const doc = isObjectId(id) ? await Model.findById(id) : null;
  if (!doc) throw new ApiError(404, `${label} not found.`);
  return doc;
}

//POST /api/admin/login { email, password } -> same as login, but only for admins
export async function adminLogin(req, res) {
  const { email, password } = req.body ?? {};
  const user = await verifyCredentials(email, password);
  if (user.role !== "admin") throw new ApiError(403, "This account doesn't have admin access.");
  setAuthCookie(res, user._id);
  res.json({ user: await mePayload(user) });
}

//GET /api/admin/stats -> dashboard cards + recent suggestions and users
export async function getStats(req, res) {
  const weekAgo = new Date(Date.now() - WEEK_MS);
  const [cafes, cafesThisWeek, users, usersThisWeek, pendingSuggestions, recentSuggestions, recentUsers] =
    await Promise.all([
      Cafe.countDocuments(),
      Cafe.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", createdAt: { $gte: weekAgo } }),
      Suggestion.countDocuments({ status: "pending" }),
      Suggestion.find().sort({ createdAt: -1 }).limit(3).populate("submittedBy", "name username"),
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(4),
    ]);

  res.json({
    stats: { cafes, cafesThisWeek, users, usersThisWeek, pendingSuggestions },
    recentSuggestions: recentSuggestions.map(suggestionJSON),
    recentUsers: recentUsers.map((u) => ({ ...publicUser(u), status: u.status })),
  });
}

//GET /api/admin/cafes?q= -> every café, including disabled ones
export async function listAllCafes(req, res) {
  const cafes = await Cafe.find(cafeSearchFilter(req.query.q)).sort({ createdAt: -1 }).limit(200);
  res.json({ cafes });
}

//POST /api/admin/cafes (multipart) { name, address, hours?, description?, tags?, featured? } + photos[]
export async function createCafe(req, res) {
  try {
    const body = req.body ?? {};
    const cafe = await Cafe.create({
      ...pick(body, ["name", "address", "hours", "description"]),
      area: body.area || areaFromAddress(body.address),
      tags: parseTags(body.tags),
      featured: toBool(body.featured),
      photos: (req.files ?? []).map((file) => fileUrl("cafes", file)),
    });
    res.status(201).json({ cafe });
  } catch (err) {
    discardUploads(req);
    throw err;
  }
}

//PATCH /api/admin/cafes/:id (JSON or multipart) -> edit fields, toggle `active`/`featured`, append photos
export async function updateCafe(req, res) {
  try {
    const cafe = await findById(Cafe, req.params.id, "Café");
    const body = req.body ?? {};
    const previousHours = cafe.hours;

    Object.assign(cafe, pick(body, ["name", "address", "hours", "description", "area"]));
    if (body.address !== undefined && body.area === undefined) cafe.area = areaFromAddress(body.address);
    if (body.tags !== undefined) cafe.tags = parseTags(body.tags);
    if (body.active !== undefined) cafe.active = toBool(body.active);
    if (body.featured !== undefined) cafe.featured = toBool(body.featured);
    if (req.files?.length) cafe.photos.push(...req.files.map((file) => fileUrl("cafes", file)));
    await cafe.save();

    //people who saved the café hear about new opening hours
    if (body.hours !== undefined && cafe.hours !== previousHours && cafe.active) {
      const fans = await User.find({ favorites: cafe._id }).select("_id");
      await notifyMany(
        fans.map((u) => u._id),
        { type: "cafe_update", cafe: cafe._id, message: `${cafe.name} updated their opening hours.` },
      );
    }

    res.json({ cafe });
  } catch (err) {
    discardUploads(req);
    throw err;
  }
}

//GET /api/admin/users?q= -> users with their visit counts
export async function listUsers(req, res) {
  const filter = { role: "user" };
  if (req.query.q) {
    const re = containsRegex(req.query.q);
    filter.$or = [{ name: re }, { username: re }, { email: re }];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
  const counts = await Log.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: "$user", visits: { $sum: 1 } } },
  ]);
  const visitsById = new Map(counts.map((c) => [String(c._id), c.visits]));

  res.json({
    users: users.map((u) => ({
      ...publicUser(u),
      email: u.email,
      status: u.status,
      visits: visitsById.get(String(u._id)) ?? 0,
    })),
  });
}

//PATCH /api/admin/users/:id { status: "active" | "suspended" }
export async function updateUserStatus(req, res) {
  const { status } = req.body ?? {};
  if (!["active", "suspended"].includes(status)) throw new ApiError(400, "Status must be active or suspended.");

  const user = await findById(User, req.params.id, "User");
  if (user.role === "admin") throw new ApiError(400, "Admin accounts can't be suspended.");
  user.status = status;
  await user.save();
  res.json({ user: { ...publicUser(user), email: user.email, status: user.status } });
}

//GET /api/admin/suggestions -> newest first
export async function listSuggestions(req, res) {
  const suggestions = await Suggestion.find().sort({ createdAt: -1 }).limit(200).populate("submittedBy", "name username");
  res.json({ suggestions: suggestions.map(suggestionJSON) });
}

//PATCH /api/admin/suggestions/:id { status: "approved" | "rejected" }
//approving publishes it as a new café; either way the submitter is notified
export async function reviewSuggestion(req, res) {
  const { status } = req.body ?? {};
  if (!["approved", "rejected"].includes(status)) throw new ApiError(400, "Status must be approved or rejected.");

  const suggestion = await findById(Suggestion, req.params.id, "Suggestion");
  if (suggestion.status !== "pending") throw new ApiError(409, `This suggestion was already ${suggestion.status}.`);

  let cafe = null;
  if (status === "approved") {
    cafe = await Cafe.create({
      name: suggestion.name,
      address: suggestion.address,
      area: areaFromAddress(suggestion.address),
      hours: suggestion.hours,
      description: suggestion.description,
      photos: suggestion.photo ? [suggestion.photo] : [],
    });
  }

  suggestion.status = status;
  suggestion.reviewedAt = new Date();
  await suggestion.save();

  if (suggestion.submittedBy) {
    const message =
      status === "approved"
        ? `Your café suggestion ${suggestion.name} has been approved and published.`
        : `Your café suggestion ${suggestion.name} wasn't approved this time.`;
    await notify(suggestion.submittedBy, { type: "system", cafe: cafe?._id, message });
  }

  await suggestion.populate("submittedBy", "name username");
  res.json({ suggestion: suggestionJSON(suggestion), cafe });
}

//PATCH /api/admin/me { name?, email? }
export async function updateAdminMe(req, res) {
  Object.assign(req.user, pick(req.body, ["name", "email"]));
  await req.user.save();
  res.json({ user: await mePayload(req.user) });
}
