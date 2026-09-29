import { Outlet, ScrollRestoration } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function RootLayout() {
  return (
    <>
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
    </>
  );
}

export default RootLayout;
