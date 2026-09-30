// Google sign-in smoke test. WRITES DATA (creates, links and suspends users): only against a freshly seeded throwaway
// database, like smoke.mjs. No real Google account or network needed: the script signs its own ID tokens and points the
// verifier at its own public key, so signature, audience and expiry are still really checked. It runs the app in-process.
// Usage (from backend/): MONGO_URI=... JWT_SECRET=... node scripts/smoke_google.mjs
import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const CLIENT_ID = "smoke-test-client.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_ID = CLIENT_ID; // before importing the app; dotenv never overrides an existing value
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Set MONGO_URI and JWT_SECRET (e.g. node --env-file=.env.test scripts/smoke_google.mjs).");
  process.exit(1);
}

const { default: app } = await import("../src/app.js");
const { googleClient } = await import("../src/lib/google.js");
const { default: User } = await import("../src/models/User.js");

await mongoose.connect(process.env.MONGO_URI);
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const { privateKey: otherKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
googleClient.getFederatedSignonCertsAsync = async () => ({
  certs: { "test-key": publicKey.export({ type: "spki", format: "pem" }) },
  format: "PEM",
});

const server = app.listen(0);
const BASE = `http://127.0.0.1:${server.address().port}`;
const PW = process.env.SEED_PASSWORD || "smoke-test-pw-123";
const stamp = Date.now();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let pass = 0, fail = 0;
const out = [];
const check = (name, cond, detail = "") => { cond ? pass++ : fail++; out.push(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + detail}`); };

function client() {
  let cookie = "";
  return async (method, path, body) => {
    const headers = cookie ? { cookie } : {};
    if (body !== undefined) headers["content-type"] = "application/json";
    const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const c of res.headers.getSetCookie()) cookie = c.split(";")[0].endsWith("=") ? "" : c.split(";")[0];
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch { json = text; }
    return { status: res.status, body: json };
  };
}

// a Google-style ID token; `over` changes claims, `opts` changes signing
const idToken = (claims, { key = privateKey, kid = "test-key", expiresIn = 300 } = {}) =>
  jwt.sign(
    { iss: "https://accounts.google.com", aud: CLIENT_ID, email_verified: true, ...claims },
    key,
    { algorithm: "RS256", keyid: kid, expiresIn },
  );

const email = (tag) => `${tag}.${stamp}@example.com`;
const anon = client();
let r;

// --- rejected tokens
r = await anon("POST", "/api/auth/google", {});
check("no credential -> 400", r.status === 400, JSON.stringify(r));
r = await anon("POST", "/api/auth/google", { credential: "garbage" });
check("garbage credential -> 401", r.status === 401, JSON.stringify(r));
r = await anon("POST", "/api/auth/google", { credential: { $gt: "" } });
check("object credential -> 400", r.status === 400, JSON.stringify(r));
r = await anon("POST", "/api/auth/google", { credential: idToken({ sub: "s1", email: email("forged") }, { key: otherKey }) });
check("token signed with another key -> 401", r.status === 401, JSON.stringify(r));
r = await anon("POST", "/api/auth/google", { credential: idToken({ sub: "s1", email: email("aud"), aud: "someone-elses-app" }) });
check("token for another client id -> 401", r.status === 401, JSON.stringify(r));
r = await anon("POST", "/api/auth/google", { credential: idToken({ sub: "s1", email: email("old") }, { expiresIn: -3600 }) }); // the library allows 5 min of clock skew: expire it well past that
check("expired token -> 401", r.status === 401, JSON.stringify(r));
r = await anon("POST", "/api/auth/google", { credential: idToken({ sub: "s1", email: email("unv"), email_verified: false }) });
check("Google email not verified -> 401", r.status === 401, JSON.stringify(r));
process.env.GOOGLE_CLIENT_ID = "";
r = await anon("POST", "/api/auth/google", { credential: idToken({ sub: "s1", email: email("off") }) });
check("not configured -> 503", r.status === 503, JSON.stringify(r));
process.env.GOOGLE_CLIENT_ID = CLIENT_ID;

// --- brand-new user
const ada = client();
const adaToken = idToken({ sub: `sub-ada-${stamp}`, email: email("Ada.G").toUpperCase(), name: "Ada Google" });
r = await ada("POST", "/api/auth/google", { credential: adaToken });
check("new Google user -> 201, isNew", r.status === 201 && r.body.isNew === true, JSON.stringify(r));
check("new user: verified, no password, derived username", r.body.user?.emailVerified === true && r.body.user?.hasPassword === false && /^ada\.g/.test(r.body.user?.username), JSON.stringify(r.body.user));
check("response has no googleId / password / session fields", !["googleId", "password", "sessionsValidAfter"].some((k) => k in (r.body.user ?? {})), JSON.stringify(r.body.user));
const adaId = r.body.user?.id;
r = await ada("GET", "/api/auth/me");
check("new user is logged in (cookie works)", r.body.user?.id === adaId, JSON.stringify(r.body));
r = await client()("POST", "/api/auth/google", { credential: adaToken });
check("same Google user again -> 200, same account", r.status === 200 && r.body.isNew === false && r.body.user?.id === adaId, JSON.stringify(r));
r = await client()("POST", "/api/auth/login", { email: email("ada.g"), password: PW });
check("password login for a Google-only account -> 401 with a hint", r.status === 401 && /Google sign-in/.test(r.body.message), JSON.stringify(r));

// --- Google-only account adds a password
r = await ada("PATCH", "/api/users/me/password", { next: "short" });
check("set password too short -> 400", r.status === 400, JSON.stringify(r));
r = await ada("PATCH", "/api/users/me/password", { next: "first-password-1" });
check("Google-only user sets a password without a current one -> 200", r.status === 200, JSON.stringify(r));
r = await ada("GET", "/api/auth/me");
check("hasPassword true afterwards", r.body.user?.hasPassword === true, JSON.stringify(r.body));
r = await client()("POST", "/api/auth/login", { email: email("ada.g"), password: "first-password-1" });
check("login with the new password -> 200", r.status === 200, JSON.stringify(r));
r = await ada("PATCH", "/api/users/me/password", { current: "wrong-one", next: "second-password-2" });
check("now the current password is required -> 400", r.status === 400, JSON.stringify(r));

// --- linking an existing VERIFIED account keeps its password
const verifiedEmail = email("verified");
const verified = client();
r = await verified("POST", "/api/auth/signup", { name: "Vera Fied", email: verifiedEmail, password: PW });
await User.updateOne({ email: verifiedEmail }, { emailVerified: true });
r = await client()("POST", "/api/auth/google", { credential: idToken({ sub: `sub-vera-${stamp}`, email: verifiedEmail, name: "Vera" }) });
check("Google sign-in links an existing verified account", r.status === 200 && r.body.isNew === false, JSON.stringify(r));
r = await client()("POST", "/api/auth/login", { email: verifiedEmail, password: PW });
check("verified account keeps its password after linking", r.status === 200, JSON.stringify(r));
r = await verified("GET", "/api/auth/me");
check("verified account's existing session survives", r.body.user?.email === verifiedEmail, JSON.stringify(r.body));

// --- pre-registered (unverified) account: the takeover case
const victimEmail = email("victim");
const attacker = client();
r = await attacker("POST", "/api/auth/signup", { name: "Mallory", email: victimEmail, password: PW });
check("attacker pre-registers the victim's email (unverified)", r.status === 201 && r.body.user?.emailVerified === false, JSON.stringify(r));
r = await attacker("GET", "/api/auth/me");
check("attacker's session works before the victim arrives", r.body.user?.email === victimEmail, JSON.stringify(r.body));
await sleep(1100); // tokens carry whole seconds: make the attacker's session strictly older than the link
const victim = client();
r = await victim("POST", "/api/auth/google", { credential: idToken({ sub: `sub-victim-${stamp}`, email: victimEmail, name: "Real Victim" }) });
check("victim signs in with Google -> linked to that account", r.status === 200 && r.body.isNew === false && r.body.user?.emailVerified === true, JSON.stringify(r));
check("linking an unverified account removes its password", r.body.user?.hasPassword === false, JSON.stringify(r.body.user));
r = await client()("POST", "/api/auth/login", { email: victimEmail, password: PW });
check("attacker's password no longer works", r.status === 401, JSON.stringify(r));
r = await attacker("GET", "/api/auth/me");
check("attacker's old session is cut off", r.body.user === null, JSON.stringify(r.body));
r = await victim("GET", "/api/auth/me");
check("victim's new session works", r.body.user?.email === victimEmail, JSON.stringify(r.body));

// --- refusals
r = await client()("POST", "/api/auth/google", { credential: idToken({ sub: `sub-admin-${stamp}`, email: "admin@brewed.app" }) });
check("admin email -> 403 (admins use the admin login)", r.status === 403 && /Admins/.test(r.body.message), JSON.stringify(r));
r = await client()("POST", "/api/auth/google", { credential: idToken({ sub: `sub-other-${stamp}`, email: email("ada.g") }) });
check("email already linked to a different Google account -> 409", r.status === 409, JSON.stringify(r));
await User.updateOne({ email: email("ada.g") }, { status: "suspended" });
r = await client()("POST", "/api/auth/google", { credential: adaToken });
check("suspended account -> 403", r.status === 403 && /suspended/.test(r.body.message), JSON.stringify(r));

// --- tidy up
await User.deleteMany({ email: new RegExp(`\\.${stamp}@example\\.com$`) });
server.close();
await mongoose.disconnect();
console.log(out.join("\n")); console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
