import Suggestion from "../models/Suggestion.js";
import { pick } from "../lib/queryHelpers.js";
import { discardUploads, fileUrl } from "../middlewares/uploadMiddleware.js";

//POST /api/suggestions (multipart) { name, address, hours?, description?, notes? } + optional "photo"
export async function createSuggestion(req, res) {
  try {
    const suggestion = await Suggestion.create({
      ...pick(req.body, ["name", "address", "hours", "description", "notes"]),
      photo: req.file ? fileUrl("suggestions", req.file) : "",
      submittedBy: req.user._id,
    });
    res.status(201).json({ suggestion });
  } catch (err) {
    discardUploads(req);
    throw err;
  }
}
