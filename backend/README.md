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
| `SEED_PASSWORD` | Password given to every account `npm run seed` creates, including `admin@brewed.app` |

## Seeding

`npm run seed` loads the Figma sample data: 4 users (e.g. `margotbrews@example.com`), the admin `admin@brewed.app`,
8 cafés, 12 logs, follows, suggestions and notifications. It **refuses to run if the database already has users**.
`npm run seed -- --reset` deletes all Brewed data and uploaded files first. Be careful if the team shares one Atlas cluster.

## Project layout

```text
src/
├── server.js          # app setup, mounts every router under /api, error handler last
├── seed.js            # sample data loader
├── config/db.js       # MongoDB connection
├── models/            # User, Cafe, Log, Follow, Suggestion, Notification
├── controllers/       # the logic, one file per resource
├── routes/            # URL -> controller, wrapped in asyncHandler
├── middlewares/       # auth (protect / optionalAuth), requireAdmin, uploads (Multer), errors
└── lib/               # ApiError, JWT cookie, café stats, notifications, query helpers
uploads/               # user-uploaded images (git-ignored), served at /uploads
```

Patterns to follow when adding routes:
- Wrap handlers in `asyncHandler` and `throw new ApiError(status, "Message")` for expected failures. The error middleware turns every error into `{ message }`.
- `protect` for logged-in routes, `optionalAuth` for public routes that personalize the result, `protect` + `requireAdmin` for admin routes.
- Never return a user document to someone else as-is; use `publicUser()` from `lib/userPayload.js`.
- After creating or deleting a `Log`, call `refreshCafeStats(cafeId)`.

## Uploads

Images go through Multer to `uploads/<cafes|logs|avatars|suggestions>/` and are stored in the database as `/uploads/...` paths.
Only JPEG, PNG, WebP and GIF are accepted (5 MB max). SVG is refused because it can carry scripts. The saved extension
comes from an allowlist, not the uploader's filename, and each file's first bytes must match its claimed type.
`/uploads` is served with `X-Content-Type-Options: nosniff` and a sandboxing CSP, so a stored file can never run as a page. They live on the server's disk, so a host with a temporary filesystem will lose them on redeploy.
Switch to a storage service before deploying there.
