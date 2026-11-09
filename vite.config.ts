import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Local development proxies /api to the live backend so the redesigned UI runs against
// the real API. Override the target with VITE_DEV_API_TARGET in .env.local.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_DEV_API_TARGET || "https://chat-bot-omega-orpin.vercel.app";
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: { "/api": { target, changeOrigin: true, secure: true } },
    },
    // Same output folder as the previous Create React App build, so deploy settings keep working.
    build: { outDir: "build", sourcemap: false },
  };
});
