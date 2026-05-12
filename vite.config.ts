import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  build: {
    
    // Generate source maps for error tracking
    sourcemap: false, // Set to true for production error monitoring

    // CSS optimization
    cssCodeSplit: true,
    // Asset inline threshold (4KB)
    assetsInlineLimit: 4096,
    // Report compressed size
    reportCompressedSize: true,
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
  },
  server: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block",
    },
  },
});
