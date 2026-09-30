// Serves the Vercel function (api/index.js) as a plain Node server, so the smoke tests hit the same code path
// as the deploy: connect-on-first-request, then the Express app. (Vercel's own routing is in vercel.json.)
// Usage (from backend/): MONGO_URI=... JWT_SECRET=... PORT=4000 node scripts/serve-vercel.mjs
import http from "node:http";
import handler from "../../api/index.js";

const port = process.env.PORT || 4000;
http.createServer(handler).listen(port, () => console.log(`Vercel function listening on http://localhost:${port}`));
