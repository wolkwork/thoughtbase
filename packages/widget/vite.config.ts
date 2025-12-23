import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    preact(),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    analyzer({
      analyzerMode: "static",
    }),
  ],
  resolve: {
    alias: {
      react: "preact/compat",
      "react-dom/test-utils": "preact/test-utils",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, "src/widget.tsx"),
      name: "FeedbackWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },
    rollupOptions: {
      external: [],
    },
  },
});
