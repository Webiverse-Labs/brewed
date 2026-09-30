# Brewed API

Express 5 + MongoDB (Mongoose) REST API for the Brewed frontend. The full endpoint list and the data model are in
[`docs/ui/data-model.md`](../docs/ui/data-model.md).

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in the values below
npm run seed           # optional: load the sample cafés, users and reviews
npm run dev            # http://localhost:4000
```

| `.env` key | What it's for |
|---|---|
| `PORT` | Port to listen on. The frontend expects `4000` |
| `MONGO_URI` | MongoDB connection string (Atlas `mongodb+srv://…` or local `mongodb://127.0.0.1:27017/brewed`) |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `CLIENT_URL` | Frontend origin allowed by CORS, default `http://localhost:5173` |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `EMAIL_FROM` | Sends verification and password-reset emails through the team Gmail account. Leave empty locally: the email (with its link) is printed in the server log instead |
| `GOOGLE_CLIENT_ID` | Public OAuth Client ID for "Sign in with Google". Empty turns it off. The frontend needs the same value as `VITE_GOOGLE_CLIENT_ID` |
| `SEED_PASSWORD` | Password given to every account `npm run seed` creates, including `admin@brewed.app` |

## Seeding

`npm run seed` loads the Figma sample data: 4 users (e.g. `margotbrews@example.com`), the admin `admin@brewed.app`,
8 cafés, 12 logs, follows, suggestions and notifications. It **refuses to run if the database already has users**.
`npm run seed -- --reset` deletes all Brewed data and uploaded images first. Be careful if the team shares one Atlas cluster.

## Project layout

```text
src/
├── app.js             # the Express app: mounts every router under /api, error handler last
├── server.js          # local entry: connect to MongoDB, then listen (Vercel uses ../api/index.js instead)
├── seed.js            # sample data loader
├── config/db.js       # MongoDB connection
├── models/            # User, Cafe, Log, Follow, Suggestion, Notification, Upload (image bytes)
├── controllers/       # the logic, one file per resource
├── routes/            # URL -> controller, wrapped in asyncHandler
├── middlewares/       # auth (protect / requireVerified / optionalAuth), requireAdmin, uploads (Multer), errors
└── lib/               # ApiError, JWT cookie, email + email tokens, Google ID-token check, café stats, notifications, query helpers
scripts/               # smoke tests, and serve-vercel.mjs (runs the Vercel function locally)
```

Patterns to follow when adding routes:
- Wrap handlers in `asyncHandler` and `throw new ApiError(status, "Message")` for expected failures. The error middleware turns every error into `{ message }`.
- `protect` for logged-in routes, `optionalAuth` for public routes that personalize the result, `protect` + `requireAdmin` for admin routes.
- `requireVerified` (after `protect`) for actions that need a confirmed email: posting, suggesting, following.
- Send email with `sendEmail` from `lib/email.js` and `await` it; a Vercel function is frozen once it has responded.
- Never return a user document to someone else as-is; use `publicUser()` from `lib/userPayload.js`.
- After creating or deleting a `Log`, call `refreshCafeStats(cafeId)`.

## Uploads

Images go through Multer (in memory) and are stored in MongoDB's `uploads` collection (`models/Upload.js`), one document per file,
under a `/uploads/<cafes|logs|avatars|suggestions>/<uuid>.<ext>` URL. That URL is what `Cafe`, `Log`, `User` and `Suggestion`
store, and `app.js` serves it. They're not kept on disk because the deploy runs as a Vercel function, which has no lasting disk.
Images count toward the database's storage (0.5 GB on Atlas Free).

Only JPEG, PNG, WebP and GIF are accepted (5 MB max). SVG is refused because it can carry scripts. The saved extension
comes from an allowlist, not the uploader's filename, and each file's first bytes must match its claimed type.
`/uploads` is served with `X-Content-Type-Options: nosniff` and a sandboxing CSP, so a stored file can never run as a page.

## Smoke tests

`scripts/smoke.mjs` (130 checks) and `scripts/smoke_security.mjs` (7 upload-safety checks) call the running API end to end.
`scripts/smoke_google.mjs` (32 checks) runs the app in-process and signs its own Google-style ID tokens, so the Google sign-in
logic (token checks, linking, the takeover case, admin refusal) is tested without a Google account or network.
They **write data** (sign up, suspend and delete accounts), so run them only against a freshly seeded throwaway database,
never the shared Atlas cluster or the test env. CI runs them on every PR. `smoke.mjs` also needs `MONGO_URI`: emailed tokens are
stored hashed, so it writes known ones straight into the database. `smoke_google.mjs` needs `MONGO_URI` and `JWT_SECRET` too.

```bash
docker run -d --rm --name brewed-mongo -p 27017:27017 mongo:7   # throwaway DB (mongo:8 won't start on some newer Linux kernels)
MONGO_URI=mongodb://127.0.0.1:27017/brewed-smoke SEED_PASSWORD=smoke-test-pw npm run seed
MONGO_URI=mongodb://127.0.0.1:27017/brewed-smoke npm run dev     # in another terminal
MONGO_URI=mongodb://127.0.0.1:27017/brewed-smoke SEED_PASSWORD=smoke-test-pw API_URL=http://localhost:4000 npm run smoke
```
