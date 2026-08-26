import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Changed to use the SWC plugin
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], // Using the imported SWC plugin
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // This line correctly maps @ to your src directory
    },
  },
  server: {
    https: false, // Revert to HTTP for the Vite dev server
    proxy: {
      // Proxy all requests starting with /api to your dashboard BFF
      "/api": {
        target: "https://bidbazaar-dashboard.onrender.com",
        changeOrigin: true, // Needed for virtual hosted sites
      },
    },
  },
});
