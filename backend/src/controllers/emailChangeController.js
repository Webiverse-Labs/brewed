import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { createToken, hashToken } from "../lib/emailTokens.js";
import { sendEmailChangeEmail, sendEmailChangedNotice } from "../lib/email.js";
import { clearAuthCookie } from "../lib/generateToken.js";
import { mePayload } from "../lib/userPayload.js";

const TTL = 24 * 60 * 60 * 1000;
const COOLDOWN = 60 * 1000;
const pendingFields = { pendingEmail: 1, emailChangeFrom: 1, emailChangeTokenHash: 1, emailChangeTokenExpires: 1 };

// A password proves account ownership; the emailed link proves ownership of the new inbox.
export async function requestEmailChange(req, res) {
  const { email, currentPassword } = req.body ?? {};
  if (typeof email !== "string" || email.trim().length > 254 || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new ApiError(400, "Enter a valid email address.");
  }
  const address = email.trim().toLowerCase();
  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(401, "Please log in to continue.");
  if (user.role !== "user") throw new ApiError(403, "Update your admin email in Admin Settings.");
  if (!user.password) throw new ApiError(400, "Set an account password before updating your email.");
  if (typeof currentPassword !== "string" || !(await user.comparePassword(currentPassword))) {
    throw new ApiError(400, "Current password is incorrect.");
  }
  if (address === user.email) throw new ApiError(400, "This is already your current email.");
  if (await User.exists({ email: address })) throw new ApiError(409, "That email address is already in use.");

  const { raw, hash } = createToken();
  const now = new Date();
  const updated = await User.findOneAndUpdate({
    _id: user._id, email: user.email, password: user.password, status: "active",
    $or: [{ emailChangeSentAt: { $exists: false } }, { emailChangeSentAt: { $lt: new Date(now - COOLDOWN) } }],
  }, { $set: {
    pendingEmail: address, emailChangeFrom: user.email, emailChangeTokenHash: hash,
    emailChangeTokenExpires: new Date(now.getTime() + TTL), emailChangeSentAt: now,
  } }, { returnDocument: "after", runValidators: true });
  if (!updated) throw new ApiError(429, "Please wait a minute before requesting another email change.");
  try {
    await sendEmailChangeEmail(user, address, raw);
  } catch {
    await User.updateOne({ _id: user._id, emailChangeTokenHash: hash }, { $unset: { ...pendingFields, emailChangeSentAt: 1 } });
    throw new ApiError(502, "Couldn't send the confirmation email. Your email hasn't changed. Please try again.");
  }
  res.json({ user: await mePayload(updated), message: `Check ${address} to confirm the change. Your current email still works until then.` });
}

export async function cancelEmailChange(req, res) {
  const user = await User.findByIdAndUpdate(req.user._id, { $unset: pendingFields }, { returnDocument: "after" });
  res.json({ user: await mePayload(user), message: "Email change cancelled." });
}

// No session is needed to open an emailed link, but confirmation never signs someone in.
export async function confirmEmailChange(req, res) {
  const token = req.body?.token;
  const invalid = new ApiError(400, "This email change link is invalid or has expired.");
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw invalid;
  const hash = hashToken(token);
  const filter = { emailChangeTokenHash: hash, emailChangeTokenExpires: { $gt: new Date() }, status: "active", role: "user" };
  const user = await User.findOne(filter).select("+emailChangeFrom");
  if (!user?.pendingEmail || user.email !== user.emailChangeFrom) throw invalid;
  if (await User.exists({ email: user.pendingEmail })) throw new ApiError(409, "That email address is already in use. Request a different address in Settings.");
  const previousEmail = user.email;
  const changed = await User.findOneAndUpdate({ ...filter, _id: user._id, email: previousEmail, pendingEmail: user.pendingEmail }, {
    $set: { email: user.pendingEmail, emailVerified: true },
    $inc: { sessionVersion: 1 },
    $unset: {
      ...pendingFields, emailChangeSentAt: 1,
      verifyTokenHash: 1, verifyTokenExpires: 1, verifySentAt: 1,
      resetTokenHash: 1, resetTokenExpires: 1, resetSentAt: 1,
    },
  }, { returnDocument: "after", runValidators: true });
  if (!changed) throw invalid;
  clearAuthCookie(res);
  try { await sendEmailChangedNotice(changed, previousEmail); } catch { console.error("Couldn't send the email-change notice."); }
  res.json({ message: "Email updated. Sign in with your new email address." });
}
