import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { asyncHandler } from "./asyncHandlerMiddleware.js";

//reads the `token` cookie; returns the user or null (bad/expired token counts as logged out)
async function userFromCookie(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(id);
  } catch {
    return null;
  }
}

//route requires a logged-in, non-suspended user -> sets req.user
export const protect = asyncHandler(async (req, res, next) => {
  const user = await userFromCookie(req);
  if (!user) throw new ApiError(401, "Please log in to continue.");
  if (user.status === "suspended") throw new ApiError(403, "This account has been suspended.");
  req.user = user;
  next();
});

//after `protect`: posting, suggesting and following need a verified email
export function requireVerified(req, res, next) {
  if (!req.user.emailVerified) return next(new ApiError(403, "Verify your email to do this."));
  next();
}

//public route that personalizes when logged in (isFavorite, isFollowing); never rejects
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const user = await userFromCookie(req);
  if (user?.status === "active") req.user = user;
  next();
});
