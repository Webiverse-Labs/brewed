import { ApiError } from "../lib/ApiError.js";

//use after `protect`
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") return next(new ApiError(403, "Admins only."));
  next();
}
