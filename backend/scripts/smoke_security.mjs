// API smoke test. WRITES DATA (creates/suspends/deletes users, adds cafés): run it only against a freshly
// seeded throwaway database, never a shared one. Needs `npm run seed` first and the API running.
// Usage (from backend/): SEED_PASSWORD=... API_URL=http://localhost:4000 node scripts/smoke_security.mjs
const BASE = process.env.API_URL || "http://localhost:4000";
let pass = 0, fail = 0; const out = [];
const check = (n, c, d = "") => { c ? pass++ : fail++; out.push(`${c ? "PASS" : "FAIL"}  ${n}${c ? "" : "  -> " + d}`); };
let cookie = "";
async function call(method, path, body, form) {
  const headers = cookie ? { cookie } : {};
  if (body) headers["content-type"] = "application/json";
  const res = await fetch(BASE + path, { method, headers, body: form ?? (body && JSON.stringify(body)) });
  for (const c of res.headers.getSetCookie()) cookie = c.split(";")[0];
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
await call("POST", "/api/auth/login", { email: "margotbrews@example.com", password: process.env.SEED_PASSWORD });
const avatar = (blob, name) => { const fd = new FormData(); fd.append("avatar", blob, name); return call("POST", "/api/users/me/avatar", undefined, fd); };

let r = await avatar(new Blob(["<script>alert(document.cookie)</script>"], { type: "image/png" }), "evil.html");
check("HTML disguised as image/png -> 400", r.status === 400, JSON.stringify(r.body));
r = await avatar(new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: "image/svg+xml" }), "x.svg");
check("SVG rejected -> 400", r.status === 400, JSON.stringify(r.body));
r = await avatar(new Blob([png], { type: "image/jpeg" }), "x.jpg");
check("PNG bytes claiming image/jpeg -> 400", r.status === 400, JSON.stringify(r.body));
r = await avatar(new Blob([png], { type: "image/png" }), "evil.html");
const url = r.body.user?.avatarUrl ?? "";
check("real PNG named .html is saved as .png", r.status === 200 && url.endsWith(".png"), JSON.stringify(r.body).slice(0, 200));
r = await call("GET", url);
check("served with nosniff", r.headers.get("x-content-type-options") === "nosniff", r.headers.get("x-content-type-options"));
check("served with CSP sandbox", /default-src 'none'; sandbox/.test(r.headers.get("content-security-policy") ?? ""), r.headers.get("content-security-policy"));
check("served as image/png", r.headers.get("content-type") === "image/png", r.headers.get("content-type"));
console.log(out.join("\n")); console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
