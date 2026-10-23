# Screen inventory

Figma link for any node: `https://www.figma.com/design/QwWr06Dzo09ZhMdjbClkuh/Brewed-Prototype?node-id=<id with : replaced by ->`
(for example, node `86:2177` → `node-id=86-2177`).

"State" rows are other versions of the same page (a different tab, a modal open, and so on). Build them as one page with state, **not as separate routes**.

---

## User app

Every signed-in page shares the floating `UserNavbar` (Brewed · Home · Explore · Log a Visit · Notifications · Profile).
The active item uses the espresso pill style.

| Screen | Route | Figma node | Screenshot | Data needed |
|---|---|---|---|---|
| **Sign Up** | `/signup` | `86:2006` | `desktop/01-sign-up.png` | `POST /api/auth/signup` {name, email, password, acceptedPolicies: true} |
| **Privacy Policy** | `/privacy` | — | — | Public policy text, linked from sign-up |
| **Terms and Conditions** | `/terms` | — | — | Public terms, linked from sign-up |
| **Confirm email change** *(added)* | `/change-email#token=…` | — | — | Public emailed-link page; explicit Confirm Email action calls `POST /api/auth/confirm-email-change`, then offers Log In |
| **Log In** | `/login` | `86:2093` | `desktop/02-log-in.png` | `POST /api/auth/login` |
| **Home** | `/` | `86:2177` | `desktop/03-home.png` | `GET /api/cafes?sort=popular`, `?featured=true`, `?sort=rating`, `?sort=new` |
| **Explore map** *(added)* | `/explore?q=` | — | — | `GET /api/cafes?q=&limit=100`; Leaflet map with saved café coordinates, shared-location pins, café details and search filtering |
| **Café profile** | `/cafes/:id` | `107:15883` | `desktop/04-cafe-detail.png` | `GET /api/cafes/:id`, `GET /api/cafes/:id/logs?public=true` |
| **Log a Visit** | `/log` | `89:6733` | `desktop/08-log-review.png` | `GET /api/cafes?q=` (café search), `POST /api/logs` |
| ↳ state: review + item added | | `172:2112` | `desktop/09-log-review-with-item.png` | |
| ↳ state: Personal Diary selected | | `112:17586` | `desktop/10-log-diary.png` | |
| ↳ state: diary + item added | | `172:2603` | `desktop/11-log-diary-with-item.png` | |
| ↳ full-height reference | | `172:1798` | — | Shows the whole form, 1305px tall |
| **Visit logged** | `/log/success` (or a state of `/log`) | `112:17834` | `desktop/12-log-success.png` | — |
| **Notifications** | `/notifications` | `89:11375` | `desktop/13-notifications.png` | `GET /api/notifications?type=`, `PATCH /api/notifications/read-all` |
| ↳ state: "Café Updates" filter | | `89:14938` | *(missing: `14-notifications-cafe.png`)* | |
| ↳ state: "System" filter | | `89:15042` | *(missing: `15-notifications-system.png`)* | |
| **Profile** (Visited tab) | `/profile`, `/u/:username` | `89:15518` | *(missing: `16-profile-visited.png`)* | `GET /api/users/:username`, `…/visited`, `…/favorites`, `…/logs` |
| ↳ state: Favorites tab | | `112:18302` | *(missing: `17-profile-favorites.png`)* | |
| ↳ state: Logs tab | | `112:17957` | *(missing: `18-profile-logs.png`)* | |
| **Settings**: Profile tab | `/settings` | `89:15729` | *(missing: `19-settings-profile.png`)* | `PATCH /api/users/me`, `POST /api/users/me/avatar` |
| ↳ state: Security tab | | `112:18504` | *(missing: `20-settings-security.png`)* | `PATCH /api/users/me/password`, `DELETE /api/users/me` |
| ↳ state: delete confirmation | | `172:1591` | *(missing: `21-settings-delete-confirm.png`)* | |

### Overlays (not routes)

| Overlay | Opened from | Figma node | Screenshot | Notes |
|---|---|---|---|---|
| **Café search panel** | Home search bar and "See all" | `89:10932` | `desktop/06-explore-search.png` | Live café results and "Explore on the map". Native modal dialog with keyboard focus |
| ↳ with tabs (Cafés / Coffee Drinkers) | | `89:10930` | — | The tabs version is the latest. Build the tabs |
| ↳ Coffee Drinkers tab | | `89:13926` *(hidden frame)* | — | User rows with Follow / Following button → `GET /api/users?q=`, `POST /api/users/:id/follow` |
| **Suggest a Café** modal | Search footer, Explore map list, Log a Visit "Can't find your café?" | `112:19512` (card only), `112:19562` (over a page) | `desktop/05-suggest-cafe-modal.png`, `desktop/07-suggest-cafe-over-page.png` | `POST /api/suggestions` (multipart, optional photo) |
| **Profile menu** | Navbar "Profile" | `89:15285` | — | 192 × 134 dropdown: Profile · Settings · Log Out |

### Log a Visit behavior

| Field | Publish Review | Personal Diary |
|---|---|---|
| Café search, date, overall rating, order items, written review | ✓ | ✓ |
| "Post Anonymously" toggle | ✓ | — |
| "Click to upload photos" | — | ✓ |

Each order item has: item name, category (dropdown, default "Coffee"), a bean rating, and a short note (optional).

### Scratch frames (ignore)

The frames named **"Brewed Prototype v1"** (`86:3732`, `112:19305`, `172:535`, `172:1181`) and the hidden `89:14808` are
working copies and composites of the screens above. The only one worth opening is `172:1798`, the full-height Log a Visit.

---

## Admin panel

Source of truth: **Admin Page (`188:2`)**. The `273:*` frames on the Desktop page are copies.

Layout: 224px `AdminSidebar` on the left (Brewed · Admin label, Dashboard / Cafés / Users / Suggestions / Settings, Sign Out at the bottom), with `AdminHeader` and the content on the right.

| Screen | Route | Desktop node | Mobile node | Data needed |
|---|---|---|---|---|
| **Admin login** | `/admin/login` | `193:207` | `210:700` | `POST /api/admin/login` |
| **Dashboard** | `/admin` | `193:312` | `210:514` | `GET /api/admin/stats` (total cafés, users, pending suggestions + weekly deltas), recent suggestions, recent users |
| **Cafés** | `/admin/cafes` | `194:546` | `210:1324` | `GET /api/admin/cafes?active=true&q=`: active cafés only. Disabling removes the row immediately; enabling in Archive returns it here. |
| ↳ Add Café modal | | `194:1129` | `210:3856` | `POST /api/cafes` (multipart): name, address, hours, tags, description, photos |
| **Users** | `/admin/users` | `194:4657` | `210:2482` | `GET /api/admin/users?status=active&q=`: active accounts only. Suspending removes the row and closes its details; reinstating in Archive returns it here. |
| **Suggestions** | `/admin/suggestions` | `194:4905` | `210:3060` | `GET /api/admin/suggestions?status=pending`: pending submissions only. Approved or rejected records leave the queue immediately; the empty state links admins to Archive. |
| ↳ detail panel open | | `194:5265` | — | `PATCH /api/admin/suggestions/:id` {status: approved \| rejected} |
| **Archive** | `/admin/archive` | — | — | Searchable tabs for approved suggestions, rejected suggestions, suspended accounts, and disabled cafés. Reviewed suggestions have read-only details; accounts can be reinstated and cafés enabled after confirmation. |
| **Settings: Profile** | `/admin/settings` | `194:5125` | `210:3514` | Display name, profile photo, sign-in email verification, and resend/check verification. |
| ↳ Security | `/admin/settings?tab=security` | — | — | Confirmed email changes, password changes, sign out other devices, and sign out. Current password is required for sensitive updates. |
| Mobile sidebar drawer | — | — | `210:2413`, `210:1025`, `210:2758`, `210:3399`, `210:3606` | Same nav as desktop, opened from a hamburger button |

No admin screenshots have been exported yet. Save them as `screens/admin/<route-name>.png`.

---

## Mobile (user app)

`screens/mobile-overview.png` shows the whole Mobile page. It has the same screens as desktop at 402px wide. The top navbar becomes a
**bottom tab bar** (Home · Explore · Log a Visit as a dark center circle · Notifications · Profile). Node IDs aren't listed here. See the gap noted in the README.

---

## Sample content (use as placeholder data)

- **Users:** Margot Chen `@margotbrews` ("Third-wave devotee. 200+ cafés logged.", 214 visits, 4.2 avg), James Okafor `@jamesonthecup`,
  Sofia Reinholt `@sofiacoffeediaries`, Tomás Vega `@thetomascup`
- **Cafés:** The Roastery House (Poblacion, Makati. 47 Matilde St. Mon–Fri 7 am – 6 pm · Sat–Sun 8 am – 5 pm. 4.5 from 245 visits),
  Blue Bottle Coffee (BGC, Taguig), Onyx Coffee Lab (Katipunan, QC), Intelligentsia Coffee (Intramuros), La Colombe Torrefaction (Ortigas),
  Verve Coffee Roasters (San Juan), Stumptown Coffee (Mandaluyong), Ritual Coffee Roasters (Marikina)
- **Suggestions:** Elm & Oak Brew (pending), Drift Coffee Co. (pending), Fold Café (approved), Common Ground (rejected)
