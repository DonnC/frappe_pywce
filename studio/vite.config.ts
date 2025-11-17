import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import frappeVitePlugin from "./vite-plugin/index.js";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    frappeVitePlugin({
      port: 8080,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: `../frappe_pywce/public/studio`,
    emptyOutDir: true,
    target: "es2015",
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
}));
