# Brewed frontend

React 19 + Vite + Tailwind CSS 4 + DaisyUI 5. The UI spec (screens, components, design tokens) is in [`docs/ui/`](../docs/ui/README.md).

## Run it

The backend must be running too (see [`backend/README.md`](../backend/README.md)).

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

The app talks to `http://localhost:4000` by default. To use a different API address, create `frontend/.env.local`
(git-ignored):

```env
VITE_API_URL=http://localhost:4000
```

If you change the frontend port, also set `CLIENT_URL` in `backend/.env`, or the browser will block the requests (CORS).

Other scripts: `npm run lint` (oxlint), `npm run build`, `npm run preview`.

## How it's organized

| Folder | Contents |
|---|---|
| `src/router.jsx` | Every route. `RequireAuth` protects the app and admin areas; `GuestOnly` keeps logged-in users off the auth pages |
| `src/pages/` | One file per screen (`auth/`, `user/`, `admin/`). `dev/UiKitPage.jsx` is at `/dev/ui` in dev only |
| `src/components/ui/` | Shared building blocks: Button, Field, BeanRating, Modal, Avatar… |
| `src/components/layout/` | Page shells: auth layout, user app (navbar + mobile tab bar), admin (sidebar/drawer) |
| `src/components/{cafe,log,user,admin}/` | Pieces for specific screens, named after the Figma layers |
| `src/context/AuthProvider.jsx` + `hooks/useAuth.js` | The logged-in user (`favorites` and `unreadNotifications` included) and `login` / `signup` / `logout` |
| `src/hooks/useApi.js` | `const { data, loading, error, reload, setData } = useApi("/cafes")` for GET requests |
| `src/lib/api.js` | Axios instance (sends the auth cookie) and `errorMessage(err)` for toasts |
| `src/lib/assetUrl.js`, `format.js` | Uploaded-image URLs and date formatting |

Conventions: use the theme classes from `index.css` (`bg-base-100`, `text-accent`, `font-display`…), not hex colors.
Components take `variant` / `size` props instead of relying on class overrides (there's no tailwind-merge).
