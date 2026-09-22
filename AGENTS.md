# Project checks

- Use Node 24. On this Windows workspace use PowerShell and `npm.cmd`; bare npm under Git Bash fails to resolve the npm shim.
- `npm run build` runs `astro check` (TypeScript) and builds the static site.
- With the dev server running, `npm run test:browser` checks the Three.js homepage in an isolated installed Chromium browser. An alternate preview URL can be passed after `--`; screenshots are written to the temporary directory printed by the check.
- GitHub Pages uses `site: https://imano177.github.io`, `base: /portfolio/`, and static output. Prefix local asset/page links with `import.meta.env.BASE_URL`; keep portfolio content in server-rendered HTML.
