import Cafe from "../models/Cafe.js";
import Log from "../models/Log.js";
import { ApiError } from "../lib/ApiError.js";
import { refreshCafeStats } from "../lib/cafeStats.js";
import { isObjectId, toBool } from "../lib/queryHelpers.js";
import { discardUploads, fileUrl } from "../middlewares/uploadMiddleware.js";

//`items` arrives as a JSON string because the form is multipart; drop rows without a name
function parseItems(raw) {
  if (raw === undefined || raw === "") return [];
  let items;
  try {
    items = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new ApiError(400, "Order items are malformed.");
  }
  if (!Array.isArray(items)) throw new ApiError(400, "Order items are malformed.");

  return items
    .filter((item) => item && String(item.name ?? "").trim())
    .map(({ name, category, rating, note }) => ({
      name: String(name),
      category,
      rating: Number(rating) || 0,
      note: note ? String(note) : "",
    }));
}

//POST /api/logs (multipart)
//fields: type review|diary, cafeId, visitedAt, rating, items (JSON), text, anonymous; files: photos[] (diary only)
export async function createLog(req, res) {
  try {
    const body = req.body ?? {};
    if (!isObjectId(body.cafeId)) throw new ApiError(400, "Choose the café you visited.");

    const cafe = await Cafe.findOne({ _id: body.cafeId, active: true });
    if (!cafe) throw new ApiError(400, "That café isn't available.");

    const type = body.type === "diary" ? "diary" : "review";
    const photos = type === "diary" ? (req.files ?? []).map((file) => fileUrl("logs", file)) : [];
    //reviews don't take photos in the design, so don't keep files sent with one
    if (type === "review") discardUploads(req);

    const log = await Log.create({
      user: req.user._id,
      cafe: cafe._id,
      type,
      visitedAt: body.visitedAt || undefined,
      rating: Number(body.rating),
      items: parseItems(body.items),
      text: body.text ? String(body.text) : "",
      anonymous: type === "review" && toBool(body.anonymous),
      photos,
    });

    await refreshCafeStats(cafe._id);
    res.status(201).json({ log });
  } catch (err) {
    discardUploads(req);
    throw err;
  }
}
