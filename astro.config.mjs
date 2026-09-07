import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://imano177.github.io",
  base: "/portfolio/",
  output: "static",
  build: {
    format: "directory"
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
