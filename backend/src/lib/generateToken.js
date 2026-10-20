import jwt from "jsonwebtoken";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

//httpOnly: JS in the browser can't read it; sameSite lax: sent from localhost:5173 -> :4000 (same site)
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

//sign a JWT for this user and store it in the `token` cookie
export function setAuthCookie(res, user) {
  const token = jwt.sign({ id: String(user._id), version: user.sessionVersion ?? 0 }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie("token", cookieOptions());
}
