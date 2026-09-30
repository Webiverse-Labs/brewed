import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { clearAuthCookie, setAuthCookie } from "../lib/generateToken.js";
import { mePayload } from "../lib/userPayload.js";
import { createToken, hashToken } from "../lib/emailTokens.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/email.js";
import { verifyGoogleCredential } from "../lib/google.js";

const RESEND_COOLDOWN_MS = 60 * 1000;
const TOKEN_TTL_MS = { verify: 24 * 60 * 60 * 1000, reset: 60 * 60 * 1000 };

//"Ada.Lovelace+x@example.com" -> "ada.lovelacex", then ada.lovelacex2, 3… until it's free
async function uniqueUsername(email) {
  let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 24);
  if (base.length < 3) base = `${base}brew`;

  let candidate = base;
  for (let n = 2; await User.exists({ username: candidate }); n += 1) candidate = `${base}${n}`;
  return candidate;
}

//Stores a fresh verify/reset token on the matching user and returns { user, raw }, or null when nothing
//matched or the last email went out under a minute ago. One atomic update, so two quick requests
//can't both pass the cooldown.
async function issueToken(kind, filter) {
  const { raw, hash } = createToken();
  const now = new Date();
  const sentAt = `${kind}SentAt`;
  const user = await User.findOneAndUpdate(
    { ...filter, $or: [{ [sentAt]: { $exists: false } }, { [sentAt]: { $lt: new Date(now - RESEND_COOLDOWN_MS) } }] },
    {
      [`${kind}TokenHash`]: hash,
      [`${kind}TokenExpires`]: new Date(now.getTime() + TOKEN_TTL_MS[kind]),
      [sentAt]: now,
    },
    { returnDocument: "after" },
  );
  return user ? { user, raw } : null;
}

//shared by user login and admin login; String() stops `{ "$gt": "" }`-style query injection
export async function verifyCredentials(email, password) {
  const user = await User.findOne({ email: String(email ?? "").toLowerCase().trim() }).select("+password");
  if (user && !user.password) {
    throw new ApiError(401, "This account uses Google sign-in. Continue with Google, or reset your password to add one.");
  }
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, "Incorrect email or password.");
  if (user.status === "suspended") throw new ApiError(403, "This account has been suspended.");
  return user;
}

//POST /api/auth/signup { name, email, password }
export async function signup(req, res) {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required.");

  const user = await User.create({
    name: String(name),
    email: String(email),
    password: String(password),
    username: await uniqueUsername(String(email)),
  });

  //a failed send must not fail the signup; the banner's Resend button covers it
  try {
    const issued = await issueToken("verify", { _id: user._id });
    await sendVerificationEmail(user, issued.raw);
  } catch (error) {
    console.error("Couldn't send the verification email:", error);
  }

  setAuthCookie(res, user._id);
  res.status(201).json({ user: await mePayload(user) });
}

//POST /api/auth/login { email, password }
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  const user = await verifyCredentials(email, password);
  setAuthCookie(res, user._id);
  res.json({ user: await mePayload(user) });
}

//POST /api/auth/logout
export async function logout(req, res) {
  clearAuthCookie(res);
  res.json({ message: "Logged out." });
}

//GET /api/auth/me -> { user } or { user: null } when logged out (no 401, so the app can check quietly on load)
export async function me(req, res) {
  res.json({ user: req.user ? await mePayload(req.user) : null });
}

//POST /api/auth/verify-email { token } -> public, so the emailed link also works on a device that isn't logged in
export async function verifyEmail(req, res) {
  const token = String(req.body?.token ?? "");
  const user = token
    ? await User.findOne({ verifyTokenHash: hashToken(token), verifyTokenExpires: { $gt: new Date() } }).select(
        "+verifyTokenHash +verifyTokenExpires",
      )
    : null;
  if (!user) throw new ApiError(400, "This verification link is invalid or has expired.");

  user.set({ emailVerified: true, verifyTokenHash: undefined, verifyTokenExpires: undefined });
  await user.save();
  res.json({ message: "Email verified." });
}

//POST /api/auth/resend-verification -> logged-in users only; one email per minute
export async function resendVerification(req, res) {
  if (req.user.emailVerified) throw new ApiError(400, "Your email is already verified.");

  const issued = await issueToken("verify", { _id: req.user._id, emailVerified: false });
  if (!issued) throw new ApiError(429, "We just sent one. Give it a minute before asking for another.");

  try {
    await sendVerificationEmail(req.user, issued.raw);
  } catch (error) {
    console.error("Couldn't send the verification email:", error);
    throw new ApiError(502, "Couldn't send the email right now. Please try again shortly.");
  }
  res.json({ message: `Verification email sent to ${req.user.email}.` });
}

//POST /api/auth/forgot-password { email } -> always the same answer, so it can't reveal which emails have accounts
export async function forgotPassword(req, res) {
  const email = String(req.body?.email ?? "").toLowerCase().trim();
  if (!email) throw new ApiError(400, "Enter your email address.");

  const issued = await issueToken("reset", { email, status: "active" });
  if (issued) {
    try {
      await sendPasswordResetEmail(issued.user, issued.raw);
    } catch (error) {
      console.error("Couldn't send the password reset email:", error);
    }
  }
  res.json({ message: "If an account exists for that email, we've sent a link to reset the password." });
}

//POST /api/auth/reset-password { token, password } -> sets the password and logs the user in
export async function resetPassword(req, res) {
  const { token, password } = req.body ?? {};
  if (!password) throw new ApiError(400, "Enter a new password.");

  const user = token
    ? await User.findOne({ resetTokenHash: hashToken(token), resetTokenExpires: { $gt: new Date() } }).select(
        "+password +resetTokenHash +resetTokenExpires",
      )
    : null;
  if (!user) throw new ApiError(400, "This reset link is invalid or has expired.");
  if (user.status === "suspended") throw new ApiError(403, "This account has been suspended.");

  //following the emailed link proves they own the inbox, so the address counts as verified too
  user.set({ password: String(password), emailVerified: true, resetTokenHash: undefined, resetTokenExpires: undefined });
  await user.save(); //minlength is checked before hashing, and a bad password leaves the link usable

  setAuthCookie(res, user._id);
  res.json({ user: await mePayload(user) });
}

//POST /api/auth/google { credential } -> the ID token from the "Sign in with Google" button; logs in, links or creates
export async function googleSignIn(req, res) {
  const credential = req.body?.credential;
  if (!credential || typeof credential !== "string") throw new ApiError(400, "Missing Google credential.");

  const profile = await verifyGoogleCredential(credential);
  //an unverified Google address proves nothing about who owns the inbox
  if (!profile.email || !profile.email_verified) throw new ApiError(401, "Your Google account's email isn't verified.");
  const email = profile.email.toLowerCase();

  let user =
    (await User.findOne({ googleId: profile.sub }).select("+password +googleId")) ??
    (await User.findOne({ email }).select("+password +googleId"));
  let isNew = false;

  if (user) {
    if (user.role === "admin") throw new ApiError(403, "Admins sign in at the admin login.");
    if (user.status === "suspended") throw new ApiError(403, "This account has been suspended.");

    if (user.googleId && user.googleId !== profile.sub) {
      throw new ApiError(409, "That email is already linked to a different Google account.");
    }
    if (!user.googleId) {
      //Closes a takeover: someone signs up with a victim's email and a password they know, the victim later uses
      //Google. The old password and any session it created are cut off, so the account really is the victim's.
      if (!user.emailVerified) {
        user.set({ password: undefined, hasPassword: false, sessionsValidAfter: new Date() });
      }
      user.set({ googleId: profile.sub, emailVerified: true });
      await user.save();
    }
  } else {
    isNew = true;
    user = await User.create({
      name: String(profile.name || email.split("@")[0]).slice(0, 80),
      email,
      username: await uniqueUsername(email),
      googleId: profile.sub,
      emailVerified: true,
      hasPassword: false,
    });
  }

  setAuthCookie(res, user._id);
  res.status(isNew ? 201 : 200).json({ user: await mePayload(user), isNew });
}
