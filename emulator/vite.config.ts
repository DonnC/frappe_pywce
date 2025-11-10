import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const frappeHost = process.env.FRAPPE_HOST || "http://localhost:8000";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: frappeHost,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
      "/socket.io": { target: frappeHost, changeOrigin: true, ws: true },
      "/assets": { target: frappeHost, changeOrigin: true },
      "/files": { target: frappeHost, changeOrigin: true },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: `../frappe_pywce/public/emulator`,
    emptyOutDir: true,
  },
}));
