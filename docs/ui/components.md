# Components

The Figma layers are named after React components from the prototype the design was imported from (`UserNavbar`, `CafeCard`, `BeanRating`, …).
**Keep those names** so a Figma layer and the matching file in `src/components/` can be searched for by the same name.

The "Uses" column counts how many times the layer appears in the Figma file. It's a rough guide to what to build first.

## Build order

### 1. Primitives: `src/components/ui/`

| Component | Figma layer | Uses | Spec |
|---|---|---|---|
| `CoffeeBean` | `CoffeeBeanSVG` | 920 | **Export from Figma as SVG** and save it as `src/assets/coffee-bean.svg`. Filled and outline variants. Used by the logo, ratings and placeholders |
| `BeanRating` | `BeanRating` | 162 | 5 beans. Props: `value` (0–5, half-steps shown as outline), `size`, `onChange` (when set, it's an input, e.g. Log a Visit "Overall Rating") |
| `Button` | `Button` | — | Variants: `primary` (espresso, full width, 44px), `ghost`, `pill` (rounded-full, used in the nav and chips), `accent-soft` ("Mark all as read"), `danger` (Delete Account) |
| `Field` | — | — | Uppercase label + input. Two looks: `filled` (`base-200`, no border: auth and suggest forms) and `outlined` (`surface` + border: Log a Visit). Password type has an eye toggle |
| `SectionLabel` | — | — | Uppercase `accent` label ("WHAT ARE YOU LOGGING?", "ABOUT") |
| `Avatar` | — | — | Initials in a circle. Colors rotate between `accent`, `secondary` and `primary`. Sizes 24 / 40 / 64 |
| `Chip` / `FilterTabs` | — | — | Rounded-full pills. Active one is espresso. Used for notification filters and profile tabs |
| `SegmentedControl` | — | — | Sign Up / Log In switch on auth, Profile / Security on settings |
| `DashedUpload` | — | — | Dashed box with icon + label: "Add an item", "Add a photo (optional)", "Click to upload photos" |
| `Modal` | — | — | 24px radius, `base-100` background, title in the display font, × close button, dimmed backdrop |
| `ImagePlaceholder` | `CafeImg` | 153 | `base-300` box with a bean and "Cafe Photo Here". Show it when a café has no photo |

### 2. User app: `src/components/`

| Component | Figma layer | Uses | Spec |
|---|---|---|---|
| `UserNavbar` | `UserNavbar` / `NavBtn` | 26 / 78 | Floating centered pill (689 × 54). Items: wordmark, Home, Explore (opens `SearchOverlay`), Log a Visit, Notifications (accent dot when unread), Profile (avatar, opens `ProfileMenu`). On mobile it becomes a bottom tab bar |
| `ProfileMenu` | `ProfileMenu` | 1 | Dropdown: Profile · Settings · Log Out |
| `CafeCard` | `CafeCard` | 64 | 240px wide: image (160px) + `BookmarkBtn` top-right, then name (display font), `MapPin` + area, then `BeanRating` |
| `CafeRow` | `CafeRow` | 8 | Section title + "See all ›" (accent) + a horizontally scrolling row of `CafeCard`s |
| `CompactCafeRow` | `CompactCafeRow` | 5 | List-style café row: thumbnail, name, full address. Used on the Profile tabs and in search results |
| `BookmarkBtn` | `BookmarkBtn` | 32 | Round button. Off: `neutral-100` + outline icon. On: `accent` + filled white icon |
| `SearchOverlay` | `SearchOverlay` / `SearchPopup` | 7 | Panel under the navbar: search input + ×, tabs Cafés / Coffee Drinkers, result list, footer "Can't find your café? Suggest a café" |
| `SearchUserRow` | `SearchUserRow` | 4 | Avatar, name, handle · bio, Follow / Following button |
| `SuggestCafeForm` | `SuggestCafeForm` | 3 | Fields inside the Suggest a Café modal. Reuse the same fields in the admin "Add Café" form |
| `LogTypePicker` | inside `LogVisitPage` | — | Two option cards (Publish Review with `Globe` icon / Personal Diary with `Lock` icon). Selected card is espresso |
| `OrderItemEditor` | inside `FormSection` | — | Repeating row: item name, category select, `BeanRating`, note, remove |
| `FormSection` | `FormSection` | 25 | `SectionLabel` + content with vertical spacing. Log a Visit is made of these |
| `ReviewCard` | inside `CafeProfilePage` | — | Avatar + name + date, `BeanRating` on the right, text, item chips (with their own ratings), optional photo. "Anonymous" shows "??" as the avatar |
| `InfoCard` / `InfoRow` | `InfoCard` / `InfoRow` | 3 / 2 | White card with a `SectionLabel`, used for ABOUT and DETAILS. `InfoRow` is icon + text |
| `RatingBreakdown` | inside `CafeProfilePage` | — | Big average (4.5), 5→1 bars with counts, "Based on N visits" |
| `NotificationItem` | inside `NotificationsPage` | — | Avatar or icon circle, message, relative time. Unread = `unread` background + accent dot |
| `StatBlock` | inside Profile | — | Big number + label (214 Visits, 4.2 Avg. Rating) |

### 3. Admin: `src/components/admin/`

| Component | Figma layer | Uses | Spec |
|---|---|---|---|
| `AdminLayout` | `AdminApp` | 28 | Sidebar + main area. Wraps every admin route with `<Outlet/>` |
| `AdminSidebar` | `AdminSidebar` | 6 | 224px wide. Logo + "Admin" label, 5 nav links with icons, Sign Out at the bottom. Becomes a drawer on mobile |
| `AdminHeader` | `AdminHeader` | 24 | Page title + subtitle (+ search / primary action on the right) |
| `StatCard` | `StatCard` | 12 | Number, label, delta line ("+8 this week", "Needs review") |
| `DataTable` | — | — | Shared by the Cafés, Users and Suggestions tables. Columns come from props, with an actions slot |
| `StatusBadge` | — | — | `pending` · `approved` · `rejected` · `active` · `suspended` |

## Pages: `src/pages/`

Build one page for each screen in [screens.md](screens.md). Their Figma layer names are
`LandingPage` (Sign Up / Log In / Admin login), `CafeProfilePage`, `LogVisitPage`, `NotificationsPage`, `UserSettingsPage`,
`AdminDashboard`, `AdminCafes`, `AdminUsers`, `AdminSuggestions` and `AdminSettings`.

`LandingPage` is one layout with a switchable card. Sign Up, Log In and Admin Login all share the same left-side hero.
