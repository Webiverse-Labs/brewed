import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./components/layout/RootLayout.jsx";
import AuthLayout from "./components/layout/AuthLayout.jsx";
import UserLayout from "./components/layout/UserLayout.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";
import GuestOnly from "./components/layout/GuestOnly.jsx";
import RequireAuth from "./components/layout/RequireAuth.jsx";
import AuthPage from "./pages/auth/AuthPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage.jsx";
import HomePage from "./pages/user/HomePage.jsx";
import CafeProfilePage from "./pages/user/CafeProfilePage.jsx";
import LogVisitPage from "./pages/user/LogVisitPage.jsx";
import LogSuccessPage from "./pages/user/LogSuccessPage.jsx";
import NotificationsPage from "./pages/user/NotificationsPage.jsx";
import ProfilePage from "./pages/user/ProfilePage.jsx";
import UserSettingsPage from "./pages/user/UserSettingsPage.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminCafesPage from "./pages/admin/AdminCafesPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import AdminSuggestionsPage from "./pages/admin/AdminSuggestionsPage.jsx";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

// The UI kit only exists in dev; the lazy import keeps it out of the production bundle.
const devRoutes = import.meta.env.DEV
  ? [{ path: "/dev/ui", lazy: async () => ({ Component: (await import("./pages/dev/UiKitPage.jsx")).default }) }]
  : [];

// Route table mirrors docs/ui/screens.md. The app requires an account: RequireAuth sends
// logged-out visitors to /login (or /admin/login), GuestOnly keeps logged-in users off the auth pages.
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: (
          <GuestOnly>
            <AuthLayout />
          </GuestOnly>
        ),
        children: [
          { path: "/signup", element: <AuthPage /> },
          { path: "/login", element: <AuthPage /> },
          { path: "/admin/login", element: <AdminLoginPage /> },
        ],
      },
      {
        // same card as the auth pages, but no GuestOnly: emailed links (and the "get a new link" page an expired
        // one points to) must work for someone who's already logged in
        element: <AuthLayout />,
        children: [
          { path: "/verify-email", element: <VerifyEmailPage /> },
          { path: "/reset-password", element: <ResetPasswordPage /> },
          { path: "/forgot-password", element: <ForgotPasswordPage /> },
        ],
      },
      {
        element: (
          <RequireAuth>
            <UserLayout />
          </RequireAuth>
        ),
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/cafes/:id", element: <CafeProfilePage /> },
          { path: "/log", element: <LogVisitPage /> },
          { path: "/log/success", element: <LogSuccessPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/u/:username", element: <ProfilePage /> },
          { path: "/settings", element: <UserSettingsPage /> },
        ],
      },
      {
        path: "/admin",
        element: (
          <RequireAuth admin>
            <AdminLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "cafes", element: <AdminCafesPage /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "suggestions", element: <AdminSuggestionsPage /> },
          { path: "settings", element: <AdminSettingsPage /> },
        ],
      },
      ...devRoutes,
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
