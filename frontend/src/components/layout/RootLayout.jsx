import { Outlet, ScrollRestoration } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AuthProvider from "../../context/AuthProvider.jsx";
import ConfirmationProvider from "../../context/ConfirmationProvider.jsx";

function RootLayout() {
  return (
    <ConfirmationProvider>
      <AuthProvider>
        <ScrollRestoration />
        <Outlet />
        <Toaster
          position="bottom-center"
          // react-hot-toast styles inline, so theme it with `style` rather than classes
          toastOptions={{
            style: {
              background: "var(--color-primary)",
              color: "var(--color-primary-content)",
              borderRadius: "var(--radius-field)",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "var(--color-accent)", secondary: "white" } },
          }}
        />
      </AuthProvider>
    </ConfirmationProvider>
  );
}

export default RootLayout;
