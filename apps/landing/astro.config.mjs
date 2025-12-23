import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tsconfigPaths from "vite-tsconfig-paths";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      tsconfigPaths({
        projects: ["./tsconfig.json", "../../packages/widget/tsconfig.json"],
      }),
      tailwindcss(),
    ],
  },
  integrations: [preact({ compat: true }), sitemap(), mdx()],
  adapter: vercel(),
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "css-variables",
    },
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  site: "https://thoughtbase.app",
});
