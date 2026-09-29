# Data model and API (derived from the screens)

This is a starting point for `backend/src/models` and `backend/src/routes`. Every field here appears somewhere in the designs. Anything not in the designs is marked *(assumed)*.

## Collections

### `User`
| Field | Type | Seen on |
|---|---|---|
| `name` | String, required | Sign Up "Full Name", Settings "Display Name" |
| `username` | String, unique | `@margotbrews` handles, Settings "Username" |
| `email` | String, unique | Sign Up, admin Users table |
| `password` | String (bcrypt hash) *(bcrypt not installed yet)* | Sign Up, Settings → Security |
| `bio` | String | Profile, Settings |
| `avatarUrl` | String | Settings "Change Avatar". Falls back to initials |
| `role` | `'user' \| 'admin'` | Admin login |
| `status` | `'active' \| 'suspended'` | Admin Users "Suspend" |
| `favorites` | [ObjectId → Cafe] | Bookmark button, Profile "Favorites" tab |
| timestamps | | Admin Users "Joined" |

### `Follow`
`{ follower: User, following: User }`, with a unique compound index. Drives "started following you", "Follow / Following" and the Coffee Drinkers search.

### `Cafe`
| Field | Type | Seen on |
|---|---|---|
| `name` | String, required | everywhere |
| `area` | String | "Poblacion, Makati" on cards |
| `address` | String | Café profile DETAILS, admin Add Café |
| `hours` | String | "Mon–Fri 7 am – 6 pm · Sat–Sun 8 am – 5 pm" |
| `description` | String | Café profile ABOUT |
| `tags` | [String] | Admin Add Café "Tags" |
| `photos` | [String] | Hero image, card image (multer upload) |
| `isActive` | Boolean | Admin "Disable" |
| `featured` | Boolean *(assumed)* | Home "Featured Cafés" |
| `avgRating`, `visitCount` | Number (denormalized, updated when a Log is saved) | Cards, admin table, "Based on 245 visits" |

### `Log` (a visit)
| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | |
| `cafe` | ObjectId → Cafe | |
| `type` | `'review' \| 'diary'` | Review = public, diary = private to the author |
| `visitedAt` | Date | "Date Visited" |
| `rating` | Number 1–5 | "Overall Rating" (beans) |
| `items` | `[{ name, category, rating, note }]` | "What did you order?" |
| `text` | String | "Written review" |
| `anonymous` | Boolean | Review only: shows as "Anonymous" / "??" |
| `photos` | [String] | Diary only in the current design |
| timestamps | | Review date on the café page |

### `Suggestion`
`{ name*, address*, hours, description, notes, photo, submittedBy: User, status: 'pending'|'approved'|'rejected', reviewedAt }`
Approving one should create a `Cafe` and send a `system` notification to the submitter ("…has been approved and published").

### `Notification`
`{ user (recipient), type: 'follow'|'cafe_update'|'system', actor?: User, cafe?: Cafe, message, read: Boolean, createdAt }`
The filter chips map to `type`: All · Café Updates · System (a hidden variant also has Followers).

## Endpoints

Auth uses a JWT in an httpOnly cookie: `cookie-parser` is installed and `api.js` already sends `withCredentials: true`.
Admin routes go through a `requireAdmin` middleware.

| Method & path | Screen |
|---|---|
| `POST /api/auth/signup` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` | Sign Up, Log In, Profile menu |
| `GET /api/cafes?q=&sort=popular\|rating\|new&featured=` | Home rows, Explore, Log a Visit café search |
| `GET /api/cafes/:id` · `GET /api/cafes/:id/logs` | Café profile (public reviews only) |
| `POST /api/cafes/:id/favorite` · `DELETE /api/cafes/:id/favorite` | Bookmark button |
| `POST /api/logs` (multipart) | Log a Visit |
| `GET /api/users?q=` · `GET /api/users/:username` · `GET /api/users/:username/{visited,favorites,logs}` | Coffee Drinkers search, Profile tabs |
| `POST /api/users/:id/follow` · `DELETE /api/users/:id/follow` | Follow button |
| `PATCH /api/users/me` · `POST /api/users/me/avatar` · `PATCH /api/users/me/password` · `DELETE /api/users/me` | Settings |
| `GET /api/notifications?type=` · `PATCH /api/notifications/read-all` | Notifications |
| `POST /api/suggestions` (multipart) | Suggest a Café modal |
| `POST /api/admin/login` · `GET /api/admin/stats` | Admin login, Dashboard |
| `POST /api/cafes` · `PATCH /api/cafes/:id` (admin) | Admin Cafés (Add / Edit / Disable) |
| `GET /api/admin/users?q=` · `PATCH /api/admin/users/:id` {status} | Admin Users |
| `GET /api/suggestions` · `PATCH /api/suggestions/:id` {status} | Admin Suggestions |
| `PATCH /api/admin/me` | Admin Settings |
