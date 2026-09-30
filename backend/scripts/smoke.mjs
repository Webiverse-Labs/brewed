// API smoke test. WRITES DATA (creates/suspends/deletes users, adds cafés): run it only against a freshly
// seeded throwaway database, never a shared one. Needs `npm run seed` first and the API running.
// Usage (from backend/): MONGO_URI=<the API's database> SEED_PASSWORD=... API_URL=http://localhost:4000 node scripts/smoke.mjs
// MONGO_URI is also needed here: the emailed verify/reset tokens are hashed, so the script writes known ones directly.
import mongoose from "mongoose";
import User from "../src/models/User.js";
import { createToken } from "../src/lib/emailTokens.js";

const BASE = process.env.API_URL || "http://localhost:4000";
const PW = process.env.SEED_PASSWORD;
let pass = 0, fail = 0;
const results = [];

function check(name, cond, detail = "") {
  if (cond) pass++; else fail++;
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  -> ${detail}`}`);
}

// tiny client with its own cookie jar
function client() {
  let cookie = "";
  return async function call(method, path, body, { form } = {}) {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let payload;
    if (form) payload = form;
    else if (body !== undefined) { headers["content-type"] = "application/json"; payload = JSON.stringify(body); }
    const res = await fetch(BASE + path, { method, headers, body: payload });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const c of set) {
      const [pair] = c.split(";");
      cookie = pair.endsWith("=") ? "" : pair; // cleared cookie -> drop it
    }
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, body: json };
  };
}

// 1x1 PNG
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const imageBlob = () => new Blob([png], { type: "image/png" });

const anon = client();
const newbie = client();
const margot = client();
const admin = client();
const stamp = Date.now();
const newEmail = `ada.${stamp}@example.com`;

// --- misc
let r = await anon("GET", "/api/nope");
check("unknown /api route -> 404 JSON", r.status === 404 && r.body.message, JSON.stringify(r));
r = await anon("POST", "/api/auth/login", undefined);
check("login with no body -> 401", r.status === 401, JSON.stringify(r));

// --- auth
r = await anon("GET", "/api/auth/me");
check("me logged out -> { user: null }", r.status === 200 && r.body.user === null, JSON.stringify(r));
r = await newbie("POST", "/api/auth/signup", { name: "Ada Lovelace", email: newEmail, password: "short" });
check("signup short password -> 400", r.status === 400 && /8 characters/.test(r.body.message), JSON.stringify(r));
r = await newbie("POST", "/api/auth/signup", { name: "Ada Lovelace", email: newEmail, password: PW });
const r0 = r;
check("signup -> 201 + user", r.status === 201 && r.body.user?.email === newEmail && !("password" in r.body.user), JSON.stringify(r));
check("signup derives username", /^ada\./.test(r.body.user?.username ?? ""), r.body.user?.username);
const newbieId = r.body.user?.id;
r = await anon("POST", "/api/auth/signup", { name: "Dup", email: newEmail, password: PW });
check("duplicate email -> 409", r.status === 409, JSON.stringify(r));
r = await anon("POST", "/api/auth/login", { email: { $gt: "" }, password: PW });
check("NoSQL-injection login -> 401", r.status === 401, JSON.stringify(r));
r = await margot("POST", "/api/auth/login", { email: "margotbrews@example.com", password: "wrong-password" });
check("wrong password -> 401", r.status === 401, JSON.stringify(r));
r = await margot("POST", "/api/auth/login", { email: "MargotBrews@example.com", password: PW });
check("login (case-insensitive email) -> 200", r.status === 200 && r.body.user?.username === "margotbrews", JSON.stringify(r));
r = await margot("GET", "/api/auth/me");
check("me has unreadNotifications = 2", r.body.user?.unreadNotifications === 2, JSON.stringify(r.body));
check("me has favorites (2)", r.body.user?.favorites?.length === 2, JSON.stringify(r.body.user?.favorites));

// --- email verification + password reset
await mongoose.connect(process.env.MONGO_URI);
// stores a token whose raw value we know (only the hash is ever stored); a negative ttl plants an already-expired one
const plantToken = async (id, kind, ttlMs = 3600e3) => {
  const { raw, hash } = createToken();
  await User.updateOne({ _id: id }, { [`${kind}TokenHash`]: hash, [`${kind}TokenExpires`]: new Date(Date.now() + ttlMs) });
  return raw;
};
check("signup -> emailVerified false", r0.body.user?.emailVerified === false, JSON.stringify(r0.body.user));
check("toJSON hides token fields", !Object.keys(r0.body.user ?? {}).some((k) => /TokenHash|TokenExpires|SentAt/.test(k)), JSON.stringify(r0.body.user));
r = await newbie("GET", "/api/auth/me");
check("me exposes emailVerified", r.body.user?.emailVerified === false, JSON.stringify(r.body));
const unverifiedLog = new FormData(); unverifiedLog.set("cafeId", "zzz"); unverifiedLog.set("rating", "4");
r = await newbie("POST", "/api/logs", undefined, { form: unverifiedLog });
check("unverified: post log -> 403", r.status === 403 && /Verify your email/.test(r.body.message), JSON.stringify(r));
r = await newbie("POST", "/api/suggestions", undefined, { form: new FormData() });
check("unverified: suggest café -> 403", r.status === 403, JSON.stringify(r));
r = await newbie("POST", `/api/users/${newbieId}/follow`);
check("unverified: follow -> 403", r.status === 403, JSON.stringify(r));
r = await newbie("POST", "/api/cafes/zzz/favorite");
check("unverified: favorites stay open (not 403)", r.status !== 403, JSON.stringify(r));
r = await anon("POST", "/api/auth/verify-email", { token: "bogus" });
check("verify with bogus token -> 400", r.status === 400, JSON.stringify(r));
r = await anon("POST", "/api/auth/verify-email", {});
check("verify with no token -> 400", r.status === 400, JSON.stringify(r));
r = await anon("POST", "/api/auth/resend-verification");
check("resend logged out -> 401", r.status === 401, JSON.stringify(r));
r = await newbie("POST", "/api/auth/resend-verification");
check("resend right after signup -> 429 (cooldown)", r.status === 429, JSON.stringify(r));
await User.updateOne({ _id: newbieId }, { verifySentAt: new Date(Date.now() - 120e3) });
r = await newbie("POST", "/api/auth/resend-verification");
check("resend after cooldown -> 200", r.status === 200, JSON.stringify(r));
r = await newbie("POST", "/api/auth/resend-verification");
check("immediate second resend -> 429", r.status === 429, JSON.stringify(r));
// expiry is checked on a still-unverified account, with the token that really matches the stored hash
const expiredToken = await plantToken(newbieId, "verify", -1000);
r = await anon("POST", "/api/auth/verify-email", { token: expiredToken });
check("verify with an expired (but otherwise correct) token -> 400", r.status === 400, JSON.stringify(r));
r = await newbie("GET", "/api/auth/me");
check("expired token leaves the account unverified", r.body.user?.emailVerified === false, JSON.stringify(r.body));
const verifyToken = await plantToken(newbieId, "verify");
r = await anon("POST", "/api/auth/verify-email", { token: verifyToken });
check("verify with real token -> 200", r.status === 200, JSON.stringify(r));
r = await anon("POST", "/api/auth/verify-email", { token: verifyToken });
check("opening the same verify link again is harmless -> 200", r.status === 200, JSON.stringify(r));
r = await newbie("GET", "/api/auth/me");
check("me: emailVerified true after verifying", r.body.user?.emailVerified === true, JSON.stringify(r.body));
r = await newbie("POST", "/api/auth/resend-verification");
check("resend when verified -> 400", r.status === 400, JSON.stringify(r));

r = await anon("POST", "/api/auth/forgot-password", { email: `nobody.${stamp}@example.com` });
const unknownMessage = r.body.message;
check("forgot-password unknown email -> 200", r.status === 200 && unknownMessage, JSON.stringify(r));
r = await anon("POST", "/api/auth/forgot-password", { email: newEmail.toUpperCase() });
check("forgot-password known email -> same 200 message", r.status === 200 && r.body.message === unknownMessage, JSON.stringify(r));
r = await anon("POST", "/api/auth/forgot-password", {});
check("forgot-password without email -> 400", r.status === 400, JSON.stringify(r));
r = await anon("POST", "/api/auth/reset-password", { token: "bogus", password: "brand-new-pass1" });
check("reset with bogus token -> 400", r.status === 400, JSON.stringify(r));
const resetToken = await plantToken(newbieId, "reset");
r = await anon("POST", "/api/auth/reset-password", { token: resetToken, password: "short" });
check("reset with short password -> 400", r.status === 400 && /8 characters/.test(r.body.message), JSON.stringify(r));
const resetter = client();
r = await resetter("POST", "/api/auth/reset-password", { token: resetToken, password: "brand-new-pass1" });
check("reset (link still valid after the bad password) -> 200 + user", r.status === 200 && r.body.user?.email === newEmail && r.body.user?.emailVerified === true, JSON.stringify(r));
r = await resetter("GET", "/api/auth/me");
check("reset logs the user in", r.body.user?.email === newEmail, JSON.stringify(r.body));
r = await anon("POST", "/api/auth/reset-password", { token: resetToken, password: "another-pass-2" });
check("reset token is single-use -> 400", r.status === 400, JSON.stringify(r));
// two requests racing with the same link: exactly one may change the password, and the winner's is the one that sticks
const raceToken = await plantToken(newbieId, "reset");
const racePasswords = ["race-password-1", "race-password-2"];
const race = await Promise.all(racePasswords.map((password) => client()("POST", "/api/auth/reset-password", { token: raceToken, password })));
check("same reset link used twice at once -> one 200, one 400", race.map((x) => x.status).sort().join() === "200,400", JSON.stringify(race));
const newPassword = racePasswords[race.findIndex((x) => x.status === 200)];
r = await client()("POST", "/api/auth/login", { email: newEmail, password: PW });
check("old password no longer works -> 401", r.status === 401, JSON.stringify(r));
r = await client()("POST", "/api/auth/login", { email: newEmail, password: "brand-new-pass1" });
check("the password from the first reset was replaced by the race winner's -> 401", r.status === 401, JSON.stringify(r));
r = await newbie("POST", "/api/auth/login", { email: newEmail, password: newPassword });
check("login with the winning new password -> 200", r.status === 200, JSON.stringify(r));
//the rest of the script logs newbie in with PW again, so put it back
await newbie("PATCH", "/api/users/me/password", { current: newPassword, next: PW });

// --- cafés
r = await anon("GET", "/api/cafes");
check("list cafés -> 8", r.status === 200 && r.body.cafes?.length === 8, JSON.stringify(r).slice(0, 200));
const byName = Object.fromEntries((r.body.cafes ?? []).map((c) => [c.name, c]));
const roastery = byName["The Roastery House"], blue = byName["Blue Bottle Coffee"], onyx = byName["Onyx Coffee Lab"];
check("cafés have id, no _id", roastery?.id && !("_id" in roastery), JSON.stringify(roastery));
check("popular sort: Roastery (3 visits) first", r.body.cafes?.[0]?.name === "The Roastery House", r.body.cafes?.[0]?.name);
r = await anon("GET", "/api/cafes?q=ony");
check("search partial 'ony' -> Onyx", r.body.cafes?.length === 1 && r.body.cafes[0].name === "Onyx Coffee Lab", JSON.stringify(r.body));
r = await anon("GET", "/api/cafes?q=" + encodeURIComponent("(("));
check("regex special chars don't crash", r.status === 200, JSON.stringify(r));
r = await anon("GET", "/api/cafes?featured=true");
check("featured -> 4", r.body.cafes?.length === 4, r.body.cafes?.length);
r = await anon("GET", "/api/cafes?sort=rating");
check("sort=rating descending", r.body.cafes?.[0]?.rating >= r.body.cafes?.[1]?.rating, JSON.stringify(r.body.cafes?.slice(0, 2).map((c) => c.rating)));
r = await anon("GET", `/api/cafes/${roastery.id}`);
check("café detail: rating 4.7, visits 3", r.body.cafe?.rating === 4.7 && r.body.cafe?.visits === 3, JSON.stringify(r.body.cafe));
check("café ratingCounts {5:2,4:1}", r.body.cafe?.ratingCounts?.[5] === 2 && r.body.cafe?.ratingCounts?.[4] === 1, JSON.stringify(r.body.cafe?.ratingCounts));
check("café isFavorite false when logged out", r.body.cafe?.isFavorite === false, r.body.cafe?.isFavorite);
r = await anon("GET", "/api/cafes/not-an-id");
check("bad café id -> 404", r.status === 404, JSON.stringify(r));
r = await anon("GET", `/api/cafes/${roastery.id}/logs`);
check("café logs -> 3 public reviews", r.body.logs?.length === 3, r.body.logs?.length);
const anonReview = r.body.logs?.find((l) => l.anonymous);
check("anonymous review hides user", anonReview && anonReview.user === null, JSON.stringify(anonReview));
check("named review has public user (no email)", r.body.logs?.some((l) => l.user?.username && !("email" in l.user)), JSON.stringify(r.body.logs?.[0]?.user));
r = await anon("POST", `/api/cafes/${roastery.id}/favorite`);
check("favorite without login -> 401", r.status === 401, JSON.stringify(r));
r = await margot("POST", `/api/cafes/${roastery.id}/favorite`);
check("favorite -> favorites now 3", r.body.favorites?.length === 3, JSON.stringify(r.body));
r = await margot("POST", `/api/cafes/${roastery.id}/favorite`);
check("favorite twice is idempotent", r.body.favorites?.length === 3, JSON.stringify(r.body));
r = await margot("GET", `/api/cafes/${roastery.id}`);
check("isFavorite true for Margot", r.body.cafe?.isFavorite === true, r.body.cafe?.isFavorite);
r = await margot("DELETE", `/api/cafes/${roastery.id}/favorite`);
check("unfavorite -> 2", r.body.favorites?.length === 2, JSON.stringify(r.body));

// --- logs
let fd = new FormData();
fd.set("cafeId", onyx.id); fd.set("type", "review"); fd.set("rating", "7");
r = await newbie("POST", "/api/logs", undefined, { form: fd });
check("log rating 7 -> 400", r.status === 400 && /between 1 and 5/.test(r.body.message), JSON.stringify(r));
fd = new FormData(); fd.set("cafeId", "zzz"); fd.set("rating", "4");
r = await newbie("POST", "/api/logs", undefined, { form: fd });
check("log bad cafeId -> 400", r.status === 400, JSON.stringify(r));
fd = new FormData(); fd.set("cafeId", onyx.id); fd.set("rating", "4");
r = await anon("POST", "/api/logs", undefined, { form: fd });
check("log without login -> 401", r.status === 401, JSON.stringify(r));
fd = new FormData();
fd.set("cafeId", onyx.id); fd.set("type", "diary"); fd.set("rating", "3"); fd.set("text", "Quiet afternoon.");
fd.set("visitedAt", new Date().toLocaleDateString("en-CA"));
fd.set("items", JSON.stringify([{ name: "Espresso", category: "Coffee", rating: 4, note: "" }, { name: "", category: "Tea" }]));
fd.append("photos", imageBlob(), "a.png"); fd.append("photos", imageBlob(), "b.png");
r = await newbie("POST", "/api/logs", undefined, { form: fd });
check("diary log with 2 photos -> 201", r.status === 201 && r.body.log?.photos?.length === 2, JSON.stringify(r));
check("empty-name item dropped", r.body.log?.items?.length === 1, JSON.stringify(r.body.log?.items));
const photoUrl = r.body.log?.photos?.[0];
//no photo means the upload above failed: report FAIL here instead of crashing on fetch(BASE + undefined)
r = photoUrl ? await anon("GET", photoUrl) : { status: 0 };
check("uploaded photo served at /uploads", r.status === 200, `${photoUrl} -> ${r.status}`);
fd = new FormData(); fd.set("cafeId", onyx.id); fd.set("type", "diary"); fd.set("rating", "3");
fd.append("photos", new Blob(["not an image"], { type: "text/plain" }), "x.txt");
r = await newbie("POST", "/api/logs", undefined, { form: fd });
check("non-image upload -> 400", r.status === 400 && /image/.test(r.body.message), JSON.stringify(r));
r = await anon("GET", `/api/cafes/${onyx.id}`);
check("café stats refreshed (Onyx visits 3)", r.body.cafe?.visits === 3, JSON.stringify(r.body.cafe));
r = await anon("GET", `/api/cafes/${onyx.id}/logs`);
check("diary not in public café logs", r.body.logs?.length === 2, r.body.logs?.length);

// --- users
r = await newbie("GET", "/api/users?q=jam");
check("user search 'jam' -> James", r.body.users?.length === 1 && r.body.users[0].username === "jamesonthecup", JSON.stringify(r.body));
check("search result has no email", r.body.users?.[0] && !("email" in r.body.users[0]), JSON.stringify(r.body.users?.[0]));
r = await newbie("GET", "/api/users?q=admin");
check("admins hidden from search", r.body.users?.length === 0, JSON.stringify(r.body));
r = await newbie("GET", "/api/users/margotbrews");
check("profile as other: visits 2 (diary hidden)", r.body.user?.visits === 2 && r.body.user?.isMe === false, JSON.stringify(r.body));
r = await margot("GET", "/api/users/margotbrews");
check("profile as self: visits 3, isMe", r.body.user?.visits === 3 && r.body.user?.isMe === true, JSON.stringify(r.body));
r = await newbie("GET", "/api/users/margotbrews/logs");
check("others see only reviews", r.body.logs?.every((l) => l.type === "review") && r.body.logs?.length === 2, JSON.stringify(r.body.logs?.map((l) => l.type)));
check("logs populate café", r.body.logs?.[0]?.cafe?.name, JSON.stringify(r.body.logs?.[0]?.cafe));
r = await margot("GET", "/api/users/margotbrews/logs");
check("owner sees diary too", r.body.logs?.length === 3, r.body.logs?.length);
r = await anon("GET", "/api/users/sofiacoffeediaries/logs");
check("anonymous reviews hidden from others (2 public, 1 anon)", r.body.logs?.length === 2 && r.body.logs.every((l) => !l.anonymous), JSON.stringify(r.body.logs?.map((l) => l.anonymous)));
r = await anon("GET", "/api/users/margotbrews/favorites");
check("favorites tab -> 2", r.body.cafes?.length === 2, r.body.cafes?.length);
r = await anon("GET", "/api/users/margotbrews/visited");
check("visited (public) -> 2 cafés", r.body.cafes?.length === 2, r.body.cafes?.length);
r = await anon("GET", "/api/users/nobody-here");
check("unknown user -> 404", r.status === 404, JSON.stringify(r));
const margotId = (await margot("GET", "/api/auth/me")).body.user.id;
r = await margot("POST", `/api/users/${margotId}/follow`);
check("follow yourself -> 400", r.status === 400, JSON.stringify(r));
r = await newbie("POST", `/api/users/${margotId}/follow`);
check("follow -> isFollowing", r.body.isFollowing === true, JSON.stringify(r));
await newbie("POST", `/api/users/${margotId}/follow`);
r = await margot("GET", "/api/notifications");
const followNotifs = r.body.notifications?.filter((n) => n.message === "Ada Lovelace started following you.");
check("follow notifies once (idempotent)", followNotifs?.length === 1, followNotifs?.length);
check("follow notification has actor", followNotifs?.[0]?.actor?.username?.startsWith("ada."), JSON.stringify(followNotifs?.[0]?.actor));
r = await newbie("GET", "/api/users?q=margot");
check("search shows isFollowing", r.body.users?.[0]?.isFollowing === true, JSON.stringify(r.body.users?.[0]));
r = await newbie("DELETE", `/api/users/${margotId}/follow`);
check("unfollow", r.body.isFollowing === false, JSON.stringify(r));

// --- settings
r = await newbie("PATCH", "/api/users/me", { username: "margotbrews" });
check("taken username -> 409", r.status === 409, JSON.stringify(r));
r = await newbie("PATCH", "/api/users/me", { username: "Ada Bad!" });
check("invalid username -> 400", r.status === 400, JSON.stringify(r));
r = await newbie("PATCH", "/api/users/me", { name: "Ada L.", username: `ada_${stamp}`, bio: "Analytical engine enjoyer.", role: "admin" });
check("update profile", r.body.user?.name === "Ada L." && r.body.user?.bio === "Analytical engine enjoyer.", JSON.stringify(r));
check("role can't be self-promoted", r.body.user?.role === "user", r.body.user?.role);
fd = new FormData(); fd.append("avatar", imageBlob(), "me.png");
r = await newbie("POST", "/api/users/me/avatar", undefined, { form: fd });
check("avatar upload", r.body.user?.avatarUrl?.startsWith("/uploads/avatars/"), JSON.stringify(r));
r = await newbie("PATCH", "/api/users/me/password", { current: "nope-nope", next: "whatever1" });
check("wrong current password -> 400", r.status === 400, JSON.stringify(r));
r = await newbie("PATCH", "/api/users/me/password", { current: PW, next: "short" });
check("new password too short -> 400", r.status === 400, JSON.stringify(r));

// --- notifications
r = await margot("GET", "/api/notifications?type=cafe_update");
check("filter by type", r.body.notifications?.length === 1 && r.body.notifications[0].type === "cafe_update", JSON.stringify(r.body));
const oneId = r.body.notifications?.[0]?.id;
r = await margot("PATCH", `/api/notifications/${oneId}/read`);
check("mark one read -> unread decreases", typeof r.body.unread === "number", JSON.stringify(r));
r = await newbie("PATCH", "/api/notifications/read-all");
r = await margot("GET", "/api/notifications");
check("other users can't clear Margot's unread", r.body.unread >= 1, r.body.unread);
r = await margot("PATCH", "/api/notifications/read-all");
check("read-all -> 0", r.body.unread === 0, JSON.stringify(r));

// --- suggestions
fd = new FormData(); fd.set("name", `Test Brew ${stamp}`); fd.set("address", "1 Test St, Diliman, Quezon City"); fd.set("hours", "Daily 8–5");
fd.append("photo", imageBlob(), "s.png");
r = await newbie("POST", "/api/suggestions", undefined, { form: fd });
check("suggest a café -> 201", r.status === 201 && r.body.suggestion?.status === "pending" && r.body.suggestion?.photo, JSON.stringify(r));
const suggestionId = r.body.suggestion?.id;
fd = new FormData(); fd.set("name", "No address");
r = await newbie("POST", "/api/suggestions", undefined, { form: fd });
check("suggestion missing address -> 400", r.status === 400, JSON.stringify(r));

// --- admin
r = await margot("GET", "/api/admin/stats");
check("non-admin -> 403 on admin route", r.status === 403, JSON.stringify(r));
r = await anon("GET", "/api/admin/stats");
check("logged out -> 401 on admin route", r.status === 401, JSON.stringify(r));
r = await client()("POST", "/api/admin/login", { email: "margotbrews@example.com", password: PW });
check("admin login as regular user -> 403", r.status === 403, JSON.stringify(r));
r = await admin("POST", "/api/admin/login", { email: "admin@brewed.app", password: PW });
check("admin login", r.status === 200 && r.body.user?.role === "admin", JSON.stringify(r));
r = await admin("GET", "/api/admin/stats");
check("stats counts", r.body.stats?.cafes === 8 && r.body.stats?.users === 5 && r.body.stats?.pendingSuggestions === 3, JSON.stringify(r.body.stats));
check("stats recent lists", r.body.recentSuggestions?.length === 3 && r.body.recentUsers?.length === 4, JSON.stringify(r.body).slice(0, 200));
fd = new FormData(); fd.set("name", "Admin Added Café"); fd.set("address", "9 Sample Rd, Kapitolyo, Pasig City"); fd.set("tags", "Specialty, Micro-roastery"); fd.append("photos", imageBlob(), "c.png");
r = await admin("POST", "/api/admin/cafes", undefined, { form: fd });
check("admin creates café (area + tags derived)", r.status === 201 && r.body.cafe?.area === "Kapitolyo, Pasig City" && r.body.cafe?.tags?.length === 2 && r.body.cafe?.photo, JSON.stringify(r));
const newCafeId = r.body.cafe?.id;
r = await admin("PATCH", `/api/admin/cafes/${blue.id}`, { hours: "Daily 6 am – 10 pm" });
check("admin edits hours", r.body.cafe?.hours === "Daily 6 am – 10 pm", JSON.stringify(r));
r = await margot("GET", "/api/notifications?type=cafe_update");
check("hours change notifies fans (Margot)", r.body.notifications?.some((n) => n.message === "Blue Bottle Coffee updated their opening hours."), JSON.stringify(r.body.notifications?.map((n) => n.message)));
r = await admin("PATCH", `/api/admin/cafes/${newCafeId}`, { active: false });
check("admin disables café", r.body.cafe?.active === false, JSON.stringify(r));
r = await anon("GET", `/api/cafes/${newCafeId}`);
check("disabled café hidden from public", r.status === 404, JSON.stringify(r));
r = await admin("GET", "/api/admin/cafes");
check("admin list includes disabled", r.body.cafes?.some((c) => c.id === newCafeId && c.active === false), r.body.cafes?.length);
r = await admin("GET", "/api/admin/users?q=ada");
check("admin users list with email + visits", r.body.users?.[0]?.email === newEmail && r.body.users?.[0]?.visits === 1, JSON.stringify(r.body));
r = await admin("PATCH", `/api/admin/users/${newbieId}`, { status: "banned" });
check("bad status -> 400", r.status === 400, JSON.stringify(r));
r = await admin("PATCH", `/api/admin/users/${newbieId}`, { status: "suspended" });
check("suspend user", r.body.user?.status === "suspended", JSON.stringify(r));
r = await newbie("GET", "/api/notifications");
check("suspended user's session rejected -> 403", r.status === 403, JSON.stringify(r));
r = await client()("POST", "/api/auth/login", { email: newEmail, password: PW });
check("suspended user can't log in -> 403", r.status === 403, JSON.stringify(r));
await admin("PATCH", `/api/admin/users/${newbieId}`, { status: "active" });
r = await admin("GET", "/api/admin/suggestions");
check("admin suggestions list with submitter", r.body.suggestions?.length === 5 && r.body.suggestions[0].submittedBy?.username, JSON.stringify(r.body.suggestions?.[0]));
r = await admin("PATCH", `/api/admin/suggestions/${suggestionId}`, { status: "approved" });
check("approve suggestion creates café", r.body.suggestion?.status === "approved" && r.body.cafe?.name === `Test Brew ${stamp}` && r.body.cafe?.area === "Diliman, Quezon City", JSON.stringify(r));
r = await admin("PATCH", `/api/admin/suggestions/${suggestionId}`, { status: "rejected" });
check("re-reviewing -> 409", r.status === 409, JSON.stringify(r));
r = await anon("GET", "/api/cafes?q=" + encodeURIComponent(`Test Brew ${stamp}`));
check("approved café is searchable", r.body.cafes?.length === 1, JSON.stringify(r.body));
r = await newbie("POST", "/api/auth/login", { email: newEmail, password: PW });
r = await newbie("GET", "/api/notifications?type=system");
check("submitter notified of approval", r.body.notifications?.some((n) => /approved and published/.test(n.message)), JSON.stringify(r.body));
r = await admin("PATCH", "/api/admin/me", { name: "Head Barista" });
check("admin updates own name", r.body.user?.name === "Head Barista", JSON.stringify(r));

// --- logout + delete account
r = await margot("POST", "/api/auth/logout");
r = await margot("GET", "/api/auth/me");
check("logout clears session", r.body.user === null, JSON.stringify(r));
r = await newbie("DELETE", "/api/users/me");
check("delete account -> 204", r.status === 204, JSON.stringify(r));
r = await client()("POST", "/api/auth/login", { email: newEmail, password: PW });
check("deleted account can't log in", r.status === 401, JSON.stringify(r));
r = await anon("GET", `/api/cafes/${onyx.id}`);
check("deleting account refreshes café stats (Onyx back to 2)", r.body.cafe?.visits === 2, JSON.stringify(r.body.cafe?.visits));
r = await admin("GET", "/api/admin/suggestions");
check("suggestion from deleted user shows null submitter", r.body.suggestions?.some((s) => s.submittedBy === null), "none null");

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
