# Testing plan

How the team tests Brewed before anyone outside the team uses it. The deploy itself (URL, accounts, resets) is described in
[`deploy/test-environment.md`](deploy/test-environment.md).

**Owner:** Rodge (PM & QA) runs test rounds and triages bugs. Everyone tests.

---

## What gets tested where

| Layer | What it covers | When | Where |
|---|---|---|---|
| **CI** | Frontend lint and build. 106 API smoke checks against the Vercel function (`api/index.js`): auth, permissions, uploads, validation, admin actions | Every PR and every push to `main` | GitHub Actions, on a throwaway database |
| **Post-deploy check** | The 6 checks in [`deploy/test-environment.md`](deploy/test-environment.md#post-deploy-check-5-minutes) | After deploys that touch auth, uploads, or server setup | Test env |
| **Scenario pass** | The scenarios below, by hand | Test rounds (see below) | Test env |
| **Exploratory** | Anything not in the scenarios: odd inputs, fast clicking, back button, small screens | 20 minutes at the end of each session | Test env |

Not covered yet: frontend unit tests, automated browser tests (end-to-end), load testing. See [Later](#later).

---

## Test rounds

- **Round 1** (first week the env is up): every scenario, each on at least one desktop browser **and** one phone.
- **After that**: CI on every PR. When a merge changes a screen, re-test that screen's scenarios on the test env.
- **Before inviting anyone outside the team**: one more full round.

For each round, open a GitHub issue titled `Test round N`, paste the scenario checklists below into it, and tick them off.
File each failure as its own bug (see [Reporting bugs](#reporting-bugs)) and link it next to the scenario.

**Session format (45 min, on a call):** 5 min to split areas. 30 min of scenarios.
10 min of exploratory testing and triage. Test areas you **didn't build**. Fresh eyes find more.

| Area | Scenarios | Tester (fill in per round) |
|---|---|---|
| Auth | A1–A8 | |
| Home, Explore, café page | H1–H4, C1–C4 | |
| Log a Visit, Suggest a Café | L1–L5, G1–G2 | |
| Profile, notifications, settings | P1–P3, N1–N2, S1–S4 | |
| Admin panel | AD1–AD8 | |
| Cross-cutting | X1–X7 | everyone, on their own device |

---

## Accounts and test data

| Account | Use it for |
|---|---|
| `margotbrews@example.com`, `jamesonthecup@example.com`, `sofiacoffeediaries@example.com`, `thetomascup@example.com` | Normal user flows. Shared by everyone |
| `admin@brewed.app` | Admin panel. Shared |
| **Your own signup** (e.g. `rodge.test1@example.com`) | Anything destructive: S3, S4, being suspended in AD5 |

The seeded accounts share one password, posted in the team chat. Never put it in an issue, commit, or screenshot.

Rules:
- **Don't change the password of, suspend, or delete a shared seeded account.** It locks everyone else out. Use your own signup.
- Start test content with `TEST` (e.g. café "TEST Kape ni Rodge") so it's easy to spot and clean up.
- No real personal info, and no photos of real people.
- Data can be reset at any time (announced in the chat). Don't keep anything important there.

---

## Scenarios

Each line is: what to do → what should happen. The IDs go in bug reports.

### Auth
- [ ] **A1** Sign up with name, email, password → lands on Home, logged in. Your profile shows a username made from your email
- [ ] **A2** Sign up with a 7-character password, then with an email that's already used → clear error each time, no account created
- [ ] **A3** Log in with a wrong password → error. With the right one → Home
- [ ] **A4** Logged out, open `/profile` or `/log` directly → sent to `/login`
- [ ] **A5** Logged in, open `/login` or `/signup` → sent back into the app
- [ ] **A6** Profile menu → Log Out → back at login. Browser back button doesn't show your private pages
- [ ] **A7** Log in, close the browser, reopen the URL → still logged in
- [ ] **A8** After an admin suspends your own test account (AD5) → login shows "This account has been suspended."

### Home, Explore, café page
- [ ] **H1** Home shows the Popular, Featured, top-rated, and newest café rows. Each café opens its page
- [ ] **H2** Explore → Cafés: search by name ("Onyx"), area ("Makati"), and tag ("Pour-over") → matching cafés
- [ ] **H3** Explore → Coffee Drinkers: search a name → user rows. Follow / Following toggles and stays after a refresh
- [ ] **H4** Search for nonsense ("zzzz") → an empty state, not a blank panel or an error
- [ ] **C1** Café page shows address, hours, description, rating breakdown, and public reviews
- [ ] **C2** Anonymous reviews show no name or avatar
- [ ] **C3** Bookmark a café → it appears in Profile → Favorites, and is still bookmarked after a refresh. Un-bookmark removes it
- [ ] **C4** Open `/cafes/doesnotexist` → a "not found" message, not a blank page

### Log a Visit, Suggest a Café
- [ ] **L1** Publish Review: find the café by search, set date and rating, add two order items (name, category, rating, note), write a review → success page. The review shows on the café page and the café's visit count and rating update
- [ ] **L2** Publish Review with "Post Anonymously" → café page shows it without your name. Your own Logs tab still shows it to you. Other users viewing your profile don't see it
- [ ] **L3** Personal Diary with 2–3 photos → it's in your own profile, **not** on the café page, and not visible to other users. Photos still load after a refresh
- [ ] **L4** Try to submit with no café, with no rating, and with a photo over 5 MB → a clear error each time, and nothing half-saved. The photo picker only offers images
- [ ] **L5** "Can't find your café?" opens the Suggest a Café modal
- [ ] **G1** Suggest a café (with and without a photo) from Explore → confirmation. It appears as *pending* in Admin → Suggestions
- [ ] **G2** Admin approves one suggestion and rejects another → the approved café appears in Explore with its photo. The suggester gets a System notification for each

### Profile, notifications, settings
- [ ] **P1** Your profile: visit count, average rating, and the Visited / Favorites / Logs tabs all match what you did
- [ ] **P2** Open another user (`/u/jamesonthecup`) → Follow. That user gets a "started following you" notification
- [ ] **P3** Open `/u/nobody-here` → "not found" message
- [ ] **N1** Notifications: the All / Café Updates / System filters show the right items. The unread badge matches
- [ ] **N2** Mark all as read → the badge clears and stays cleared after a refresh
- [ ] **S1** Settings → Profile: change name, username, and bio → the profile shows them. A username someone else has → error
- [ ] **S2** Upload an avatar → it shows in the navbar and on the profile, and is still there after a refresh **and after the next deploy**
- [ ] **S3** *(own account)* Change password: a wrong current password → error. Success → log out, and only the new password works
- [ ] **S4** *(own account)* Delete account → logged out, can't log in again, and that account's reviews are gone from café pages

### Admin panel (`/admin`)
- [ ] **AD1** `/admin/login` with `margotbrews@…` → refused. With `admin@brewed.app` → dashboard
- [ ] **AD2** As a normal user, open `/admin` → not allowed in
- [ ] **AD3** Dashboard totals and "recent" lists match the data. Add a café, and the total goes up
- [ ] **AD4** Cafés: search. Add a café with photos, tags ("Specialty, Pour-over"), and an address → the area is derived from the address and it shows in Explore. Edit it. Disable it → gone from Home/Explore but still in the admin list. Enable it again
- [ ] **AD5** Users: search, view, suspend your own test account → that account is blocked (A8). The admin account can't be suspended. Reactivate
- [ ] **AD6** Suggestions: open the detail panel, approve or reject. An already-reviewed suggestion can't be reviewed again
- [ ] **AD7** Settings: change the admin display name → the Settings page shows the new name, and it's still there after a refresh
- [ ] **AD8** On a phone: the hamburger opens the sidebar drawer, and every admin page is usable

### Cross-cutting
- [ ] **X1** Refresh on every page → same page, still logged in
- [ ] **X2** Back / forward buttons move between pages as expected. Closing a modal doesn't need the back button
- [ ] **X3** Phone (about 375 px wide): bottom tab bar, no sideways scrolling, and modals and forms fit and work
- [ ] **X4** Upload real phone photos (several MB each): an avatar, and 6 diary photos at once → they upload and still look sharp. (The app shrinks them first, because Vercel refuses requests over 4.5 MB)
- [ ] **X5** Two accounts at once (normal and private window): follow each other, see notifications arrive, and confirm diary entries stay private
- [ ] **X6** Compare screens with Figma (`docs/ui/screens.md`). File differences as *Cosmetic*
- [ ] **X7** DevTools → Network → "Slow 4G": submit buttons grey out while saving ("Please wait…", "Saving…"). Double-clicking doesn't create two logs or two accounts

### Browsers and devices

Between the team, cover each of these at least once per round:

| Desktop | Phone |
|---|---|
| Chrome or Edge, Firefox | Safari on iPhone, Chrome on Android |

---

## Reporting bugs

Use **New issue → Test environment bug** on GitHub. The form asks for the scenario ID, URL, severity, account, steps,
expected vs. actual, device, and a screenshot. One bug per issue. Search first.

| Severity | Meaning | Fix by |
|---|---|---|
| **Blocker** | Can't continue, data lost, or a security problem | Before the next test session |
| **Major** | A feature is broken or wrong, with a workaround | Before the next round |
| **Minor** | Works, but confusing or inconsistent | When convenient |
| **Cosmetic** | Visual only, or differs from Figma | When convenient |

Triage (Rodge, end of each session): confirm severity, assign someone, close duplicates.
A fix PR says `Fixes #<issue>`. After it deploys, **the reporter** re-tests and closes the issue.

---

## Done criteria: ready for outside testers

- [ ] No open Blocker or Major bugs
- [ ] Every scenario passed on at least one desktop and one phone browser in the latest round
- [ ] CI green on `main`
- [ ] The "Before real users" list in [`deploy/test-environment.md`](deploy/test-environment.md#before-real-users-not-needed-now) is done

---

## Known gaps

- **Image URLs are unguessable but not private.** A diary photo is hidden in the app, but anyone who has its `/uploads/…` link can open it.
- **No login rate limiting**, and "Forgot your password?" is a "coming soon" toast.
- **Café deletion doesn't exist.** Admins disable cafés instead.
- Undecided in the design: the Settings "Support" and "Danger Zone" sections, the coffee-bean artwork and café photo, and the final fonts.
  Don't file these as bugs.

## Later

- Browser tests (e.g. Playwright) for the core flows: sign up (A1), publish a review (L1), admin adds a café (AD4). Run them in CI.
- Backend unit tests (`node --test`) for the logic in `lib/`: café stats, deriving the area from an address, notifications.
- Split `smoke.mjs` so CI can run parts of it against the test env without writing data.
