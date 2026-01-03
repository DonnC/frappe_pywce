import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import frappeVitePlugin from "./vite-plugin/index.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isStandalone = env.VITE_APP_MODE === 'standalone';

  console.log(`🏗️ Building Pywce-Studio in ${isStandalone ? 'STANDALONE' : 'FRAPPE'} mode`);

  return {
    plugins: [
      react(),
      // Only use the Frappe plugin if NOT in standalone mode
      !isStandalone && frappeVitePlugin({
        port: 8080,
        appName: "Pywce-Studio",
        prefixEndpoint: "/bot/studio",
      }),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@/services/backend": path.resolve(
          __dirname, 
          isStandalone ? "./src/services/standalone" : "./src/services/frappe"
        ),
      },
    },

    // Standalone build might go to a different folder (optional)
    build: {
      outDir: isStandalone ? "dist-standalone" : `../frappe_pywce/public/studio`,
      emptyOutDir: true,
      target: "es2015",
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
    },
  };
});