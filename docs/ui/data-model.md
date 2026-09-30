# Data model and API

This is what `backend/src/models` and `backend/src/routes` actually implement. Every field comes from the designs, except the ones marked *(added)*.
API responses use `id` (never `_id`) and never include `__v` or the password hash.

## Collections

### `User`
| Field | Type | Seen on |
|---|---|---|
| `name` | String, required | Sign Up "Full Name", Settings "Display Name" |
| `username` | String, unique, 3–30 of `a-z 0-9 _ .` | `@margotbrews` handles, Settings "Username". Derived from the email at sign-up |
| `email` | String, unique | Sign Up, admin Users table |
| `password` | bcrypt hash, min 8 chars, never selected by default | Sign Up, Settings → Security |
| `bio` | String (≤ 200) | Profile, Settings |
| `avatarUrl` | `/uploads/avatars/…` | Settings "Change Avatar". Falls back to initials |
| `role` | `user` \| `admin` | Admin login |
| `status` | `active` \| `suspended` | Admin Users "Suspend" |
| `favorites` | [Cafe] | Bookmark button, Profile "Favorites" tab |
| `emailVerified` *(added)* | Boolean, default `false` | Verify-email banner. Unverified users can't post logs, suggest cafés or follow |
| `verifyToken*`, `resetToken*` *(added)* | SHA-256 hash, expiry and last-sent time of the emailed links; never selected, never in a response | Verification and password reset emails |
| `createdAt` | Date | Admin Users "Joined" |

### `Follow`
`{ follower, following }`, with a unique index on the pair. Drives "started following you", Follow / Following, and `isFollowing`.

### `Cafe`
| Field | Type | Seen on |
|---|---|---|
| `name`, `address` | String, required | everywhere |
| `area` | String | "Poblacion, Makati" on cards. Derived from the last two parts of the address if not given |
| `hours`, `description` | String | Café profile |
| `tags` | [String] | Admin "Tags" |
| `photos` | [`/uploads/cafes/…`] | `photo` (a virtual field) is the first one, used as the cover |
| `active` | Boolean | Admin "Disable". Disabled cafés disappear from the user app |
| `featured` | Boolean *(added)* | Home "Featured Cafés". Admins set it with a toggle in the café editor |
| `rating`, `visits` | Number | Worked out from the café's logs by `lib/cafeStats.js`. Never set these by hand |

### `Log` (a visit)
| Field | Notes |
|---|---|
| `user`, `cafe` | Required |
| `type` | `review` (public) \| `diary` (private to the author) |
| `visitedAt` | Date, not in the future |
| `rating` | 1–5, required |
| `items` | `[{ name, category: Coffee\|Tea\|Pastry\|Food\|Other, rating 0–5, note }]` |
| `text` | Written review |
| `anonymous` | Reviews only. The API hides the author, and the review never appears on the author's public profile |
| `photos` | Diary only (as in the design), up to 6 |

### `Suggestion`
`{ name*, address*, hours, description, notes, photo, submittedBy, status: pending|approved|rejected, reviewedAt }`.
Approving creates a `Cafe`. Approving or rejecting sends the submitter a `system` notification.

### `Notification`
`{ user (recipient), type: follow|cafe_update|system, actor?, cafe?, message, read }`.
They are created by: a new follow (`follow`), an admin changing the opening hours of a café the user saved (`cafe_update`), and a suggestion being reviewed (`system`).

---

## Endpoints

Base URL: `http://localhost:4000/api`. Auth is a JWT in an httpOnly `token` cookie. The frontend sends it with `withCredentials: true`.
Errors are always `{ message }` with the right status: 400 bad input, 401 not logged in, 403 not allowed or suspended, 404, 409 conflict.

🔓 public · 🔑 logged in · ✉️ also needs a verified email (403 "Verify your email to do this.") · 🛡️ admin. "optional" means it works either way but personalizes the result when logged in.

| Method & path | Who | Notes |
|---|---|---|
| `POST /auth/signup` `{ name, email, password }` | 🔓 | Sets the cookie → `{ user }` |
| `POST /auth/login` `{ email, password }` | 🔓 | 401 for wrong credentials, 403 if suspended |
| `POST /auth/logout` | 🔓 | Clears the cookie |
| `POST /auth/verify-email` `{ token }` | 🔓 | Marks the email verified. 400 for a wrong or expired (24 h) token. Opening the same link again is harmless |
| `POST /auth/resend-verification` | 🔑 | One email per minute (429 after that). 400 if already verified |
| `POST /auth/forgot-password` `{ email }` | 🔓 | Always 200 with the same message, so it doesn't reveal which emails have accounts. Link lasts 1 h, works once |
| `POST /auth/reset-password` `{ token, password }` | 🔓 | Sets the password, marks the email verified, logs the user in → `{ user }`. 400 for a bad token or short password |
| `GET /auth/me` | optional | `{ user }` including `favorites` and `unreadNotifications`, or `{ user: null }` |
| `GET /cafes?q=&sort=popular\|rating\|new&featured=true&limit=` | 🔓 | Active cafés only. `q` matches name, area and tags |
| `GET /cafes/:id` | optional | Adds `ratingCounts {5..1}` and `isFavorite` |
| `GET /cafes/:id/logs` | 🔓 | Public reviews only. Anonymous ones have `user: null` |
| `POST` / `DELETE /cafes/:id/favorite` | 🔑 | → `{ favorites }` |
| `POST /logs` (multipart) | 🔑 ✉️ | `type, cafeId, visitedAt, rating, text, anonymous, items` (a JSON string) + `photos[]` |
| `GET /users?q=` | optional | Coffee Drinkers search, adds `isFollowing` |
| `GET /users/:username` | optional | Profile header: `visits`, `avgRating`, `isFollowing`, `isMe` |
| `GET /users/:username/visited` · `/favorites` · `/logs` | optional | Diary entries and anonymous reviews are only included for the owner |
| `POST` / `DELETE /users/:id/follow` | 🔑 (`POST` also ✉️) | → `{ isFollowing }` |
| `PATCH /users/me` `{ name?, username?, bio? }` | 🔑 | → `{ user }` |
| `POST /users/me/avatar` (multipart `avatar`) | 🔑 | → `{ user }` |
| `PATCH /users/me/password` `{ current, next }` | 🔑 | |
| `DELETE /users/me` | 🔑 | Deletes the user's logs, follows, notifications and uploads |
| `GET /notifications?type=` | 🔑 | → `{ notifications, unread }` |
| `PATCH /notifications/read-all` · `/notifications/:id/read` | 🔑 | → `{ unread }` |
| `POST /suggestions` (multipart `photo`) | 🔑 | |
| `POST /admin/login` | 🔓 | Like login, but only succeeds for admins |
| `GET /admin/stats` | 🛡️ | Totals, last-7-day counts, recent suggestions and users |
| `GET /admin/cafes?q=` · `POST /admin/cafes` · `PATCH /admin/cafes/:id` | 🛡️ | Includes disabled cafés. Create and edit are multipart (`photos[]`). `PATCH { active }` to disable or enable |
| `GET /admin/users?q=` · `PATCH /admin/users/:id { status }` | 🛡️ | Admins can't be suspended |
| `GET /admin/suggestions` · `PATCH /admin/suggestions/:id { status }` | 🛡️ | Only pending suggestions can be reviewed (otherwise 409) |
| `PATCH /admin/me { name?, email? }` | 🛡️ | |

Uploaded images are served from `http://localhost:4000/uploads/…`. The frontend turns those paths into full URLs with `lib/assetUrl.js`.
