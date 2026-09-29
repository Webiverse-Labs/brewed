import multer from "multer";
import { ApiError } from "../lib/ApiError.js";

//unknown /api route -> JSON 404 instead of Express's HTML page
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

//must be registered last in server.js; every error reaches here through next(err)
//Express only treats a middleware as an error handler when it declares all 4 params, so keep `next`
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  //schema validation failed (e.g. rating outside 1–5): join the field messages
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
    return res.status(400).json({ message });
  }

  //unique index violated, e.g. email or username already taken
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "value";
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }

  //malformed ObjectId in the URL means the document can't exist
  if (err.name === "CastError") {
    return res.status(404).json({ message: "Not found." });
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Images must be 5 MB or smaller." : err.message;
    return res.status(400).json({ message });
  }

  //malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body." });
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server." });
}
