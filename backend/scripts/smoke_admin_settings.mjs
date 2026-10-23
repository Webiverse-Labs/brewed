// Uses a uniquely named test database; never reads or modifies accounts in the configured database.
// Outbound mail is captured locally. MONGO_URI supplies only the test MongoDB server connection.
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { createToken, hashToken } from "../src/lib/emailTokens.js";

if (!process.env.MONGO_URI || process.env.NODE_ENV === "production") throw new Error("Configure a non-production MongoDB test server.");
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "admin-settings-test-only-secret";
process.env.GMAIL_USER = "";
process.env.GMAIL_APP_PASSWORD = "";
const database = `brewed_admin_settings_test_${process.pid}_${Date.now()}`;
await mongoose.connect(process.env.MONGO_URI, { dbName: database });
const { default: app } = await import("../src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const originalLog = console.log;
const mail = [];
console.log = (...args) => { if (args.join(" ").includes("[email not sent")) mail.push(args.join(" ")); else originalLog(...args); };
let checks = 0;
const check = (name, condition) => { assert.ok(condition, name); checks++; originalLog(`PASS ${name}`); };
const emailToken = () => [...mail].reverse().find((text) => text.includes("Subject: Confirm your new email"))?.match(/change-email#token=([a-f0-9]{64})/)?.[1];
const noSecrets = (user) => !["password", "sessionVersion", "emailChangeFrom", "emailChangeTokenHash", "emailChangeTokenExpires", "resetTokenHash"].some((key) => key in user);
function client() {
  let cookie = "";
  return async (method, path, body) => {
    const multipart = body instanceof FormData;
    const response = await fetch(base + path, {
      method, headers: { ...(cookie ? { cookie } : {}), ...(!multipart && body ? { "content-type": "application/json" } : {}) },
      body: multipart ? body : body ? JSON.stringify(body) : undefined,
    });
    for (const value of response.headers.getSetCookie()) cookie = value.split(";")[0].endsWith("=") ? "" : value.split(";")[0];
    return { status: response.status, body: await response.json(), cookieIssued: response.headers.getSetCookie().some((value) => /^token=[^;]/.test(value)) };
  };
}
const admin = client(), other = client(), regular = client(), anon = client();
const password = "original-admin-test-password";
const nextPassword = "changed-admin-test-password";
const originalEmail = "admin-original@example.com";
const targetEmail = "admin-updated@example.com";
let adminUser;
const login = (who, email = originalEmail, secret = password) => who("POST", "/api/admin/login", { email, password: secret });
try {
  adminUser = await User.create({ name: "Admin Test", username: "admin_settings_test", role: "admin", email: originalEmail, password, emailVerified: false });
  await User.create({ name: "Regular Test", username: "regular_settings_test", email: "regular@example.com", password, emailVerified: true });
  for (const [method, path, body] of [
    ["PATCH", "/api/admin/me", { name: "No" }], ["POST", "/api/admin/me/avatar", {}],
    ["PATCH", "/api/admin/me/email", { email: targetEmail, currentPassword: password }],
    ["PATCH", "/api/admin/me/password", { current: password, next: nextPassword }],
    ["POST", "/api/admin/me/sign-out-others", { currentPassword: password }],
  ]) {
    check(`${path} requires authentication`, (await anon(method, path, body)).status === 401);
    await regular("POST", "/api/auth/login", { email: "regular@example.com", password });
    check(`${path} requires an administrator`, (await regular(method, path, body)).status === 403);
  }
  check("admin signs in", (await login(admin)).status === 200);
  let r = await admin("PATCH", "/api/admin/me", { name: "Updated Admin", role: "user", emailVerified: true });
  check("profile edits save the name without changing privileges or verification", r.body.user.name === "Updated Admin" && r.body.user.role === "admin" && r.body.user.emailVerified === false && noSecrets(r.body.user));
  r = await admin("PATCH", "/api/admin/me", { email: targetEmail });
  check("profile route cannot bypass email confirmation", r.status === 400 && (await User.findById(adminUser._id)).email === originalEmail);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const photo = new FormData(); photo.set("avatar", new Blob([png], { type: "image/png" }), "avatar.png");
  r = await admin("POST", "/api/admin/me/avatar", photo);
  check("admin photo is saved and persists", r.status === 200 && r.body.user.avatarUrl.endsWith(".png") && (await admin("GET", "/api/auth/me")).body.user.avatarUrl === r.body.user.avatarUrl);
  const invalidPhoto = new FormData(); invalidPhoto.set("avatar", new Blob(["<script>bad</script>"], { type: "image/png" }), "bad.png");
  check("fake images are rejected", (await admin("POST", "/api/admin/me/avatar", invalidPhoto)).status === 400);
  await admin("POST", "/api/auth/resend-verification");
  const verification = mail.find((text) => text.includes("Subject: Verify your email"))?.match(/verify-email#token=([a-f0-9]{64})/)?.[1];
  check("admin can verify their current inbox", Boolean(verification) && (await anon("POST", "/api/auth/verify-email", { token: verification })).status === 200 && (await admin("GET", "/api/auth/me")).body.user.emailVerified === true);
  for (const body of [{ email: targetEmail }, { email: targetEmail, currentPassword: "wrong" }, { email: "bad-email", currentPassword: password }, { email: originalEmail, currentPassword: password }]) {
    check("email changes reject missing/wrong passwords and invalid/unchanged addresses", (await admin("PATCH", "/api/admin/me/email", body)).status === 400);
  }
  check("taken emails are rejected", (await admin("PATCH", "/api/admin/me/email", { email: "regular@example.com", currentPassword: password })).status === 409);
  const requestEmail = (email = targetEmail, secret = password) => admin("PATCH", "/api/admin/me/email", { email, currentPassword: secret });
  const cooldown = () => User.updateOne({ _id: adminUser._id }, { $unset: { emailChangeSentAt: 1 } });
  r = await requestEmail();
  let token = emailToken();
  check("request keeps the old email active and exposes only safe pending state", r.status === 200 && r.body.user.email === originalEmail && r.body.user.pendingEmail === targetEmail && r.body.user.emailVerified && noSecrets(r.body.user));
  check("confirmation token is hashed in storage", Boolean(token) && (await User.findById(adminUser._id).select("+emailChangeTokenHash")).emailChangeTokenHash === hashToken(token));
  check("resends have a cooldown", (await requestEmail()).status === 429);
  await admin("DELETE", "/api/admin/me/email");
  check("cancellation invalidates the link", (await anon("POST", "/api/auth/confirm-email-change", { token })).status === 400);
  await cooldown(); await requestEmail(); token = emailToken();
  await User.updateOne({ _id: adminUser._id }, { emailChangeTokenExpires: new Date(0) });
  check("expired links cannot change an admin email", (await anon("POST", "/api/auth/confirm-email-change", { token })).status === 400);
  await admin("DELETE", "/api/admin/me/email"); await cooldown();
  process.env.NODE_ENV = "production";
  try { check("delivery failure preserves the email and clears pending state", (await requestEmail()).status === 502 && !(await User.findById(adminUser._id)).pendingEmail); }
  finally { process.env.NODE_ENV = "test"; }
  await requestEmail(); token = emailToken();
  const reset = createToken();
  await User.updateOne({ _id: adminUser._id }, { resetTokenHash: reset.hash, resetTokenExpires: new Date(Date.now() + 60000) });
  await login(other);
  check("wrong current password cannot change credentials", (await admin("PATCH", "/api/admin/me/password", { current: "wrong", next: nextPassword })).status === 400);
  for (const next of ["short", password, "x".repeat(73), { password: nextPassword }]) {
    check("invalid new passwords are rejected", (await admin("PATCH", "/api/admin/me/password", { current: password, next })).status === 400);
  }
  r = await admin("PATCH", "/api/admin/me/password", { current: password, next: nextPassword });
  check("password changes keep this browser signed in and hide secrets", r.status === 200 && r.cookieIssued && noSecrets(r.body.user) && (await admin("GET", "/api/admin/stats")).status === 200);
  check("password changes revoke other sessions", (await other("GET", "/api/admin/stats")).status === 401);
  check("password changes cancel email and recovery links", (await anon("POST", "/api/auth/confirm-email-change", { token })).status === 400 && (await anon("POST", "/api/auth/reset-password", { token: reset.raw, password })).status === 400);
  check("old passwords stop working", (await login(client())).status === 401);
  check("new passwords work", (await login(other, originalEmail, nextPassword)).status === 200);
  check("signing out devices rechecks the password", (await admin("POST", "/api/admin/me/sign-out-others", { currentPassword: "wrong" })).status === 400);
  r = await admin("POST", "/api/admin/me/sign-out-others", { currentPassword: nextPassword });
  check("sign out other devices retains this session", r.status === 200 && r.cookieIssued && (await admin("GET", "/api/admin/stats")).status === 200);
  check("other devices lose access", (await other("GET", "/api/admin/stats")).status === 401);
  await User.updateOne({ _id: adminUser._id }, { $unset: { sessionVersion: 1 } });
  await login(admin, originalEmail, nextPassword); await login(other, originalEmail, nextPassword);
  check("legacy accounts can revoke old sessions", (await admin("POST", "/api/admin/me/sign-out-others", { currentPassword: nextPassword })).status === 200 && (await other("GET", "/api/admin/stats")).status === 401);
  await cooldown(); await requestEmail(targetEmail, nextPassword); token = emailToken();
  await login(other, originalEmail, nextPassword);
  const confirmed = await Promise.all([anon("POST", "/api/auth/confirm-email-change", { token }), client()("POST", "/api/auth/confirm-email-change", { token })]);
  check("email confirmations apply only once", confirmed.filter((result) => result.status === 200).length === 1 && confirmed.filter((result) => result.status === 400).length === 1);
  check("admin email confirmation returns to Admin Access without signing in", confirmed.find((result) => result.status === 200).body.adminLoginRequired === true && !confirmed.some((result) => result.cookieIssued));
  check("email changes revoke every old session", (await admin("GET", "/api/admin/stats")).status === 401 && (await other("GET", "/api/admin/stats")).status === 401);
  check("old email stops working and new email works", (await login(client(), originalEmail, nextPassword)).status === 401 && (await login(admin, targetEmail, nextPassword)).status === 200);
  check("admins still cannot use regular sign-in", (await anon("POST", "/api/auth/login", { email: targetEmail, password: nextPassword })).status === 403);
  check("confirmed email is verified", (await admin("GET", "/api/auth/me")).body.user.emailVerified === true);
  const recovery = createToken();
  await User.updateOne({ _id: adminUser._id }, { resetTokenHash: recovery.hash, resetTokenExpires: new Date(Date.now() + 60000) });
  r = await anon("POST", "/api/auth/reset-password", { token: recovery.raw, password });
  check("admin recovery also revokes existing sessions", r.status === 200 && r.body.adminLoginRequired && (await admin("GET", "/api/admin/stats")).status === 401);
  await login(admin, targetEmail, password); await login(other, targetEmail, password);
  r = await admin("PATCH", "/api/users/me/password", { current: password, next: nextPassword });
  check("legacy password route cannot bypass admin session revocation", r.status === 200 && (await other("GET", "/api/admin/stats")).status === 401);
  await login(other, targetEmail, nextPassword);
  const races = await Promise.all([
    admin("PATCH", "/api/admin/me/password", { current: nextPassword, next: password }),
    other("PATCH", "/api/admin/me/password", { current: nextPassword, next: "another-valid-admin-password" }),
  ]);
  check("concurrent credential changes cannot both succeed", races.filter((result) => result.status === 200).length === 1 && races.every((result) => [200, 400, 401, 409].includes(result.status)));
  r = await regular("PATCH", "/api/users/me/email", { email: "regular-new@example.com", currentPassword: password });
  token = emailToken();
  check("regular user email changes still work", r.status === 200 && (await anon("POST", "/api/auth/confirm-email-change", { token })).body.adminLoginRequired === false);
} finally {
  process.env.NODE_ENV = "test";
  console.log = originalLog;
  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.name !== database || !database.startsWith("brewed_admin_settings_test_")) throw new Error("Refusing to clean up a non-test database.");
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}
originalLog(`${checks} admin account security checks passed.`);
