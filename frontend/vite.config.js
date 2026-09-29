import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pre-bundle at startup. Otherwise Vite discovers these on the first page load, re-optimizes,
  // and briefly serves two copies of React ("Invalid hook call") before it force-reloads.
  optimizeDeps: {
    include: ["react-router-dom", "react-hot-toast", "lucide-react"],
  },
});
