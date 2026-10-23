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
| `pendingEmail` *(added)* | Optional String; visible to the account owner | Settings → Security → Update Email. The current email remains active until the new inbox confirms the change |
| `emailChange*`, `sessionVersion` *(added)* | Hidden token hash, expiry, original address, resend time, and session counter | Email-change links expire in 24 hours and work once. Confirmation invalidates existing sessions and old verify/reset links. Password changes, recovery, and an unverified account's Google ownership claim cancel pending changes |
| `password` | bcrypt hash, min 8 chars, never selected by default | Sign Up, Settings → Security |
| `bio` | String (≤ 200) | Profile, Settings |
| `avatarUrl` | `/uploads/avatars/…` | Settings "Change Avatar". Falls back to initials |
| `role` | `user` \| `admin` | Admin login |
| `status` | `active` \| `suspended` | Admin Users "Suspend" |
| `favorites` | [Cafe] | Bookmark button, Profile "Favorites" tab |
| `hasPassword` *(added)* | Boolean, default `true`. `false` for accounts created with Google until they set a password | Settings → Security ("Set a password" vs "Update Password") |
| `googleId`, `sessionsValidAfter` *(added)* | Google's user id (unique, never selected) and the moment before which login cookies are refused; neither appears in a response | Google sign-in |
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
| `location` *(added)* | `{ lat, lng }` or `null` | Confirmed coordinates for Explore map pins. Admin create/edit accepts `latitude` and `longitude`; both blank removes a pin, omitting both preserves it. Unlocated cafés remain searchable |
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
| `POST /auth/signup` `{ name, email, password, acceptedPolicies: true }` | 🔓 | Records the server's policy version and acceptance date, sets the cookie → `{ user }`. Missing or non-boolean acceptance returns 400 with `code: POLICY_ACCEPTANCE_REQUIRED` |
| `POST /auth/login` `{ email, password }` | 🔓 | Regular users only. 401 for wrong credentials, 403 if suspended or if valid admin credentials are submitted. Admins must use `/admin/login`; no session is created by a rejected login |
| `POST /auth/google` `{ credential, acceptedPolicies? }` | 🔓 | The ID token from Google's button. Logs in, links to the account with that email, or creates one → `{ user, isNew }`. New accounts require `acceptedPolicies: true`; otherwise returns 400 with `code: POLICY_ACCEPTANCE_REQUIRED` so the UI can ask for agreement first. 401 for a bad or unverified token, 403 for admins and suspended accounts, 409 if the email is already linked to a different Google account, 503 if `GOOGLE_CLIENT_ID` is unset |
| `POST /auth/logout` | 🔓 | Clears the cookie |
| `POST /auth/verify-email` `{ token }` | 🔓 | Marks the email verified. 400 for a wrong or expired (24 h) token. Opening the same link again is harmless |
| `POST /auth/confirm-email-change` `{ token }` | 🔓 | Applies a pending email change once, verifies the new email, and signs out existing sessions. No automatic login. 400 for an invalid/expired link; 409 if the address was taken before confirmation |
| `POST /auth/resend-verification` | 🔑 | One email per minute (429 after that). 400 if already verified |
| `POST /auth/forgot-password` `{ email }` | 🔓 | Always 200 with the same message, so it doesn't reveal which emails have accounts. Link lasts 1 h, works once |
| `POST /auth/reset-password` `{ token, password }` | 🔓 | Sets the password and marks the email verified. Regular users are signed in → `{ user }`. Admins receive `{ adminLoginRequired: true, message }` without a session and must use Admin Access. 400 for a bad token or short password |
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
| `PATCH /users/me/email` `{ email, currentPassword }` | 🔑 | Regular users: rechecks the password and sends a confirmation link to the new inbox; preserves current email and verification. → `{ user, message }`. 409 for an address in use; 429 during the one-minute resend cooldown; 502 on email delivery failure without changing the address. Google-only accounts must first set a password |
| `DELETE /users/me/email` | 🔑 | Cancels the signed-in account's pending email change and invalidates its link → `{ user, message }` |
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
| `GET /admin/suggestions?status=pending\|approved\|rejected&q=` · `PATCH /admin/suggestions/:id { status }` | 🛡️ | Lists pending by default; reviewed suggestions remain in Archive. Only pending suggestions can be reviewed (otherwise 409). Archive also uses `GET /admin/users?status=suspended&q=` and `GET /admin/cafes?active=false&q=`. |
| `PATCH /admin/me { name? }` · `POST /admin/me/avatar` (multipart `avatar`) | 🛡️ | Profile edits cannot change email, role, or verification. Photo uploads use the same validated image storage as user avatars. |
| `PATCH /admin/me/email { email, currentPassword }` · `DELETE /admin/me/email` | 🛡️ | Requests or cancels a pending email update. Current email stays active until confirmation, with the same expiry, cooldown, and delivery-failure rollback as regular users. |
| `PATCH /admin/me/password { current, next }` | 🛡️ | Rechecks current password, atomically updates the hash, cancels pending email/recovery links, revokes other sessions, and renews this browser's cookie. |
| `POST /admin/me/sign-out-others { currentPassword }` | 🛡️ | Rechecks the password, revokes other sessions, and keeps this browser signed in. |

Uploaded images are served from `http://localhost:4000/uploads/…`. The frontend turns those paths into full URLs with `lib/assetUrl.js`.
