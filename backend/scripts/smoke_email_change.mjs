// WRITES DATA: use a throwaway test database, never the shared Atlas database.
// Runs in-process; outbound mail is captured locally, with no Gmail or Google network requests.
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { createToken, hashToken } from "../src/lib/emailTokens.js";

if (!process.env.MONGO_URI || !process.env.JWT_SECRET || process.env.NODE_ENV === "production") {
  throw new Error("Use an explicitly configured, non-production test database.");
}
process.env.NODE_ENV = "test";
process.env.GMAIL_USER = "";
process.env.GMAIL_APP_PASSWORD = "";
const { default: app } = await import("../src/app.js");
await mongoose.connect(process.env.MONGO_URI);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const stamp = Date.now();
const password = "test-email-password-123";
const original = `email-old-${stamp}@example.com`;
const target = `email-new-${stamp}@example.com`;
const taken = `email-taken-${stamp}@example.com`;
const log = console.log;
const mail = [];
console.log = (...args) => {
  const text = args.join(" ");
  if (text.includes("[email not sent")) mail.push(text);
  else log(...args);
};
let pass = 0, fail = 0;
const results = [];
const check = (name, condition) => { condition ? pass++ : fail++; results.push(`${condition ? "PASS" : "FAIL"} ${name}`); };
const latestToken = () => [...mail].reverse().find((text) => text.includes("Subject: Confirm your new email"))?.match(/change-email#token=([a-f0-9]{64})/)?.[1];
function client() {
  let cookie = "";
  return async (method, path, body) => {
    const response = await fetch(base + path, { method, headers: { ...(cookie ? { cookie } : {}), ...(body ? { "content-type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    for (const value of response.headers.getSetCookie()) cookie = value.split(";")[0].endsWith("=") ? "" : value.split(";")[0];
    return { status: response.status, body: await response.json() };
  };
}
const anon = client(), owner = client(), otherSession = client();
let user, googleOnly, occupied;
try {
  user = await User.create({ name: "Email Test", username: `email_test_${stamp}`, email: original, password, emailVerified: true, googleId: `email-linked-${stamp}` });
  occupied = await User.create({ name: "Taken", username: `taken_${stamp}`, email: taken, password });
  googleOnly = await User.create({ name: "Google Only", username: `google_${stamp}`, email: `google-${stamp}@example.com`, hasPassword: false, emailVerified: true, googleId: `email-google-${stamp}` });
  const change = () => owner("PATCH", "/api/users/me/email", { email: target, currentPassword: password });
  const cooldown = () => User.updateOne({ _id: user._id }, { $unset: { emailChangeSentAt: 1 } });
  let r = await anon("PATCH", "/api/users/me/email", { email: target, currentPassword: password });
  check("email updates require authentication", r.status === 401);
  await owner("POST", "/api/auth/login", { email: original, password });
  await otherSession("POST", "/api/auth/login", { email: original, password });
  for (const email of [undefined, "bad-email", { $gt: "" }, original]) {
    r = await owner("PATCH", "/api/users/me/email", { email, currentPassword: password });
    check(`invalid or unchanged address (${typeof email}) rejected`, r.status === 400);
  }
  r = await owner("PATCH", "/api/users/me/email", { email: target, currentPassword: "wrong" });
  check("current password is required", r.status === 400);
  r = await owner("PATCH", "/api/users/me/email", { email: taken, currentPassword: password });
  check("existing email is rejected", r.status === 409);
  r = await owner("PATCH", "/api/users/me", { email: target, emailVerified: true, pendingEmail: target });
  check("profile edits cannot bypass the email-change route", r.body.user.email === original && !r.body.user.pendingEmail);

  r = await owner("PATCH", "/api/users/me/email", { email: ` ${target.toUpperCase()} `, currentPassword: password });
  let token = latestToken();
  check("request keeps the current email and saves normalized pending email", r.status === 200 && r.body.user.email === original && r.body.user.pendingEmail === target && r.body.user.emailVerified === true);
  check("outgoing mail contains an actual confirmation link", Boolean(token));
  const stored = await User.findById(user._id).select("+emailChangeTokenHash");
  check("only the token hash is stored", stored.emailChangeTokenHash === hashToken(token));
  check("email-change secrets and session version stay out of responses", !["emailChangeFrom", "emailChangeTokenHash", "emailChangeTokenExpires", "emailChangeSentAt", "sessionVersion", "password"].some((key) => key in r.body.user));
  r = await change();
  check("resends are rate limited", r.status === 429);
  await owner("DELETE", "/api/users/me/email");
  r = await anon("POST", "/api/auth/confirm-email-change", { token });
  check("cancelling invalidates the previous link", r.status === 400);
  check("cancellation keeps the old email", (await User.findById(user._id)).email === original);

  await cooldown(); await change(); token = latestToken();
  await User.updateOne({ _id: user._id }, { emailChangeTokenExpires: new Date(0) });
  r = await anon("POST", "/api/auth/confirm-email-change", { token });
  check("expired links are rejected", r.status === 400);
  await cooldown(); await change(); token = latestToken();
  await User.updateOne({ _id: occupied._id }, { email: target });
  r = await anon("POST", "/api/auth/confirm-email-change", { token });
  check("address uniqueness is rechecked at confirmation", r.status === 409 && (await User.findById(user._id)).email === original);
  await User.updateOne({ _id: occupied._id }, { email: taken });

  await cooldown();
  process.env.NODE_ENV = "production";
  r = await change();
  process.env.NODE_ENV = "test";
  check("mail failure leaves the old address intact and allows retry", r.status === 502 && !(await User.findById(user._id)).pendingEmail);
  await change(); token = latestToken();
  const reset = createToken(), verify = createToken();
  await User.updateOne({ _id: user._id }, { resetTokenHash: reset.hash, resetTokenExpires: new Date(Date.now() + 60000), verifyTokenHash: verify.hash, verifyTokenExpires: new Date(Date.now() + 60000) });
  const confirmations = await Promise.all([anon("POST", "/api/auth/confirm-email-change", { token }), client()("POST", "/api/auth/confirm-email-change", { token })]);
  check("concurrent confirmations apply exactly once", confirmations.filter((result) => result.status === 200).length === 1 && confirmations.filter((result) => result.status === 400).length === 1);
  const changed = await User.findById(user._id).select("+googleId");
  check("confirmed email is verified and pending state is cleared", changed.email === target && changed.emailVerified && !changed.pendingEmail);
  check("identity and Google link are preserved", changed.username === user.username && changed.googleId === user.googleId);
  r = await owner("GET", "/api/auth/me");
  check("the original session is revoked immediately", r.body.user === null);
  r = await otherSession("GET", "/api/auth/me");
  check("other sessions are revoked immediately too", r.body.user === null);
  r = await anon("POST", "/api/auth/reset-password", { token: reset.raw, password });
  check("reset links sent to the old address stop working", r.status === 400);
  r = await anon("POST", "/api/auth/verify-email", { token: verify.raw });
  check("old verification links stop working", r.status === 400);
  r = await client()("POST", "/api/auth/login", { email: original, password });
  check("the old address can no longer sign in", r.status === 401);
  r = await owner("POST", "/api/auth/login", { email: target, password });
  check("the new address signs in with the existing password", r.status === 200 && r.body.user.email === target);
  r = await owner("GET", "/api/auth/me");
  check("the fresh session works after version rotation", r.body.user?.email === target);

  const nextTarget = `email-next-${stamp}@example.com`;
  await owner("PATCH", "/api/users/me/email", { email: nextTarget, currentPassword: password }); token = latestToken();
  await owner("PATCH", "/api/users/me/password", { current: password, next: password });
  r = await anon("POST", "/api/auth/confirm-email-change", { token });
  check("password changes cancel pending email changes", r.status === 400);
  await owner("PATCH", "/api/users/me/email", { email: nextTarget, currentPassword: password }); token = latestToken();
  const recovery = createToken();
  await User.updateOne({ _id: user._id }, { resetTokenHash: recovery.hash, resetTokenExpires: new Date(Date.now() + 60000) });
  await anon("POST", "/api/auth/reset-password", { token: recovery.raw, password });
  r = await anon("POST", "/api/auth/confirm-email-change", { token });
  check("password recovery cancels pending email changes", r.status === 400);

  const { default: jwt } = await import("jsonwebtoken");
  const googleCookie = jwt.sign({ id: String(googleOnly._id) }, process.env.JWT_SECRET, { expiresIn: "5m" });
  const response = await fetch(base + "/api/users/me/email", { method: "PATCH", headers: { cookie: `token=${googleCookie}`, "content-type": "application/json" }, body: JSON.stringify({ email: nextTarget, currentPassword: password }) });
  check("Google-only users must set an account password first", response.status === 400 && /Set an account password/.test((await response.json()).message));
} finally {
  process.env.NODE_ENV = "test";
  console.log = log;
  await User.deleteMany({ _id: { $in: [user?._id, googleOnly?._id, occupied?._id].filter(Boolean) } });
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
}
log(results.join("\n"));
log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
