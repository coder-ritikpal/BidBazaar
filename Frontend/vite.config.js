import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      https: false,
      proxy: {
        "/api": {
          target: (() => {
            try {
              return new URL(env.VITE_API_URL_DASHBOARD || "http://localhost:3004").origin;
            } catch {
              return "http://localhost:3004";
            }
          })(),
          changeOrigin: true,
        },
      },
    },
  };
});
