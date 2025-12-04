import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    analyzer(),
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    outDir: "public",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/widget.tsx"),
      name: "FeedbackWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },
    rollupOptions: {
      external: [],
    },
    minify: true,
  },
});
