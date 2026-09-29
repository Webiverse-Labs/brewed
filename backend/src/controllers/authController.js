import User from "../models/User.js";
import { ApiError } from "../lib/ApiError.js";
import { clearAuthCookie, setAuthCookie } from "../lib/generateToken.js";
import { mePayload } from "../lib/userPayload.js";

//"Ada.Lovelace+x@example.com" -> "ada.lovelacex", then ada.lovelacex2, 3… until it's free
async function uniqueUsername(email) {
  let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 24);
  if (base.length < 3) base = `${base}brew`;

  let candidate = base;
  for (let n = 2; await User.exists({ username: candidate }); n += 1) candidate = `${base}${n}`;
  return candidate;
}

//shared by user login and admin login; String() stops `{ "$gt": "" }`-style query injection
export async function verifyCredentials(email, password) {
  const user = await User.findOne({ email: String(email ?? "").toLowerCase().trim() }).select("+password");
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
