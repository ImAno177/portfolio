import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://imano177.github.io",
  base: "/portfolio/",
  output: "static",
  devToolbar: { enabled: false },
  build: {
    format: "directory"
  }
});
