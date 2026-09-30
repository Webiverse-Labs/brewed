# Design tokens

The theme is warm café paper: cream background, espresso-dark text and buttons, a terracotta accent, and a sage secondary.
All values below are defined in `frontend/src/index.css`. **Use the class names, not the hex values.**

> The Figma file has no color or text styles, so the hex values were sampled from exported screenshots.
> The fonts were identified by eye. See "Known gaps" in [README.md](README.md).

## Colors

| Token (class) | Hex | Used for |
|---|---|---|
| `base-100` | `#FBF9F5` | Page background, search panel, modal background |
| `surface` | `#FFFFFF` | Cards, auth card, notification rows, text inputs on Log a Visit |
| `base-200` | `#F3EDE4` | Filled inputs (auth, suggest form), segmented-control track, order chips, icon tiles |
| `base-300` | `#E8E2D9` | "Cafe Photo Here" image placeholder, borders |
| `base-content` / `primary` | `#2B1E1A` | Headings, body text, primary buttons, active nav pill, selected option card |
| `primary-content` | `#FFFFFF` | Text on espresso |
| `primary-soft` | `#4B3F3B` | Icon tile *inside* a selected dark card |
| `accent` | `#C86D51` | Section labels ("WHAT ARE YOU LOGGING?"), "See all", links, active bookmark, unread dot, avatar fill |
| `accent-soft` | `#F6ECE6` | "Mark all as read" pill, accent icon tile |
| `unread` | `#F8F2ED` | Unread notification row background |
| `secondary` | `#7A8B7B` | Sage: paragraph/meta text ("Good morning", subtitles, timestamps), secondary avatar |
| `muted` | `#A89F98` | Input placeholders, "Cafe Photo Here" caption |
| `neutral-100` | `#EDEBE6` | Inactive bookmark button, neutral icon circles |
| backdrop | `rgb(0 0 0 / 0.18)` | Dim layer behind Explore and modals (sampled as `#D1CECE` over cream) |

Admin status badges (`pending` / `approved` / `rejected` / `active`) have no screenshot yet, so `success`, `warning` and `error` in the theme are placeholders.

## Typography

| Role | Font (unconfirmed) | Where | Approx. size |
|---|---|---|---|
| Display / headings | **Fraunces** (serif, has an italic) | Landing hero, page titles, café names, "Brewed" wordmark | Hero ≈ 64px, page title ≈ 32px, section title ≈ 20px, card title ≈ 15px |
| UI / body | **Plus Jakarta Sans** | Everything else | Body 15–16px, meta 13px |
| Section label | Sans, UPPERCASE, letter-spacing ≈ 0.08em, `accent` | "WHAT ARE YOU LOGGING?", "ABOUT", "DETAILS" | ≈ 13px |
| Field label | Sans, UPPERCASE, medium weight, `base-content` | "FULL NAME", "EMAIL", "DATE VISITED" | ≈ 12px |

The landing hero sets one word in italic ("*deserves*").

Tailwind classes: `font-display` for serif, `font-sans` (the default) for body.

## Shape

| Token | Value | Used for |
|---|---|---|
| `--radius-field` | 14px | Inputs, primary buttons |
| `--radius-box` | 16px | Café cards, option cards, notification rows, info cards |
| `rounded-3xl` (24px) | 24px | Auth card, modals, search panel |
| `rounded-full` | — | Navbar pill, nav buttons, filter chips, avatars, bookmark buttons, "Mark all as read" |
| Dashed border | 1.5px dashed `base-300` | "Add an item", "Add a photo", "Click to upload photos" |

## Elevation

| Name | Used for | CSS |
|---|---|---|
| soft | Navbar pill, auth card | `0 8px 24px rgb(43 30 26 / 0.08)` |
| float | Explore panel, modals | `0 20px 48px rgb(43 30 26 / 0.14)` |
| none + 1px border | Cards, inputs on Log a Visit | `border border-base-300` |

## Layout sizes (from Figma frames)

| Thing | Size |
|---|---|
| User navbar | Floating pill, centered, 16px from top, **689 × 54**. Nav buttons are 32px tall |
| Page content offset | Content starts at y ≈ 96 (below the floating navbar) |
| Home horizontal padding | 40px |
| Café card (Home) | 240px wide, 160px image, 16px gap. Rows scroll horizontally |
| Form column (Log a Visit, Notifications) | ≈ 624px wide, centered |
| Auth layout | 1024px container: hero on the left, 340px card on the right |
| Input / primary button height | 44px |
| Admin sidebar | **224px** wide (`w-56`). Main area is 971px |
| Icons | 14–18px, outline style: use `lucide-react` (`Home`, `Search`, `Plus`, `Bell`, `Bookmark`, `MapPin`, `Globe`, `Lock`, `Eye`, `X`, `Camera`, `CircleCheck`) |
| Coffee-bean glyph | A custom SVG (`CoffeeBeanSVG`) used for the logo, the rating beans and the image placeholder. **Export it from Figma as SVG.** Don't redraw it |
