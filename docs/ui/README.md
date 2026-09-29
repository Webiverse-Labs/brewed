# Brewed UI documentation

The UI spec for Brewed, taken from the Figma file
[Brewed-Prototype](https://www.figma.com/design/QwWr06Dzo09ZhMdjbClkuh/Brewed-Prototype).
Use these files to build the frontend, so the team doesn't have to dig through Figma for every detail.

| File | What's in it | Who uses it |
|---|---|---|
| [tokens.md](tokens.md) | Colors, fonts, radii, shadows, layout sizes | Everyone on frontend: these values are already in `frontend/src/index.css` |
| [screens.md](screens.md) | Every screen: route, Figma node, state variants, screenshot | Frontend (pages), QA (checking against design) |
| [components.md](components.md) | Shared components, with names taken from the Figma layers | Frontend (`src/components/`) |
| [data-model.md](data-model.md) | Collections and API endpoints the screens need | Backend (`models/`, `routes/`) |
| `screens/` | PNG exports of the designs | Everyone |

## Figma file layout

The Figma file has three pages:

| Page | Node | Contents |
|---|---|---|
| Mobile Page | `0:1` | Mobile versions of the user app (see `screens/mobile-overview.png`) |
| Desktop Page | `86:2004` | Desktop user app, plus a copy of the admin screens (`273:*`) |
| Admin Page | `188:2` | Admin panel, desktop and mobile. **Treat this page as the source of truth for admin.** |

Design sizes: desktop frames are **1195 × 728**, mobile frames are **402 × 874**.

## How to build from this

1. **Theme first.** The palette is already set up in `index.css` as a DaisyUI theme. Use `bg-base-100`, `text-primary` and so on, never raw hex values.
2. **Shared components** from `components.md`, starting with `UserNavbar`, `CafeCard`, `BeanRating`, `Field` and `Button`.
3. **Pages with hardcoded data.** Copy the sample content from `screens.md` (Margot Chen, The Roastery House, …) so you can compare each page against its screenshot.
4. **Backend**: build the models and routes listed in `data-model.md`.
5. **Swap the fake data** for `api.get(...)` calls through `src/lib/api.js`.

## Known gaps (fill these in when you can)

- **Fonts are not confirmed.** They were identified by eye from the screenshots. To confirm, click a heading and a body text layer in Figma and check the font name in the right panel, then update `tokens.md` and `index.html`.
- **Hex colors were sampled from screenshot pixels**, not read from Figma styles, because the file has no color variables. They should be within a shade or two. Check the main ones (`#2B1E1A`, `#C86D51`, `#FBF9F5`) in Figma.
- **Screenshots are missing** for Profile, Settings, the Notification filter states, and every admin screen. The export stopped when the Figma MCP Starter plan call limit was reached. To add them, select the frame in Figma, choose Export → PNG, and save it into `screens/desktop/` using the file name listed in `screens.md`.
- **Mobile user-app node IDs are not listed**, because the Mobile page was too large to read through the API. Its screens mirror the desktop ones one-to-one.
