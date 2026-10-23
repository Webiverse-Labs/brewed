import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { matchSessionVersion, setAuthCookie } from "../lib/generateToken.js";
import { mePayload } from "../lib/userPayload.js";

async function authenticateAdmin(req, password) {
  if (req.user.role !== "admin") throw new ApiError(403, "Administrator access is required.");
  const user = await User.findOne({
    _id: req.user._id, role: "admin", status: "active", sessionVersion: matchSessionVersion(req.user.sessionVersion ?? 0),
  }).select("+password");
  if (!user) throw new ApiError(401, "Please sign in again.");
  if (typeof password !== "string" || !(await user.comparePassword(password))) throw new ApiError(400, "Current password is incorrect.");
  return user;
}

const unchangedCredentials = (user) => ({
  _id: user._id, role: "admin", status: "active", password: user.password, sessionVersion: matchSessionVersion(user.sessionVersion ?? 0),
});

function validatePassword(next) {
  if (typeof next !== "string" || next.length < 8) throw new ApiError(400, "Use at least 8 characters for your new password.");
  if (Buffer.byteLength(next, "utf8") > 72) throw new ApiError(400, "Password is too long. Please use a shorter password.");
}

const passwordUpdate = (password) => ({
  $set: { password, hasPassword: true },
  $inc: { sessionVersion: 1 },
  $unset: {
    pendingEmail: 1, emailChangeFrom: 1, emailChangeTokenHash: 1, emailChangeTokenExpires: 1, emailChangeSentAt: 1,
    resetTokenHash: 1, resetTokenExpires: 1, resetSentAt: 1,
  },
});

export async function resetAdminPassword(user, tokenHash, next) {
  validatePassword(next);
  const update = passwordUpdate(await bcrypt.hash(next, 10));
  update.$set.emailVerified = true;
  return User.findOneAndUpdate({ _id: user._id, role: "admin", status: "active", resetTokenHash: tokenHash, resetTokenExpires: { $gt: new Date() } }, update, { returnDocument: "after", runValidators: true });
}

// Atomic credential changes prevent concurrent requests from keeping a revoked session alive.
export async function changeAdminPassword(req, res) {
  const { current, next } = req.body ?? {};
  const user = await authenticateAdmin(req, current);
  validatePassword(next);
  if (current === next) throw new ApiError(400, "Choose a password different from your current one.");
  const password = await bcrypt.hash(next, 10);
  const updated = await User.findOneAndUpdate(unchangedCredentials(user), passwordUpdate(password), { returnDocument: "after", runValidators: true });
  if (!updated) throw new ApiError(409, "Your account changed. Sign in again before retrying.");
  setAuthCookie(res, updated);
  res.json({ user: await mePayload(updated), message: "Password updated. Other devices have been signed out." });
}

export async function signOutOtherAdminSessions(req, res) {
  const user = await authenticateAdmin(req, req.body?.currentPassword);
  const updated = await User.findOneAndUpdate(unchangedCredentials(user), { $inc: { sessionVersion: 1 } }, { returnDocument: "after" });
  if (!updated) throw new ApiError(409, "Your account changed. Sign in again before retrying.");
  setAuthCookie(res, updated);
  res.json({ message: "Other devices have been signed out. This browser is still signed in." });
}
