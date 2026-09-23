# Project checks

- Use Node 24. On this Windows workspace use PowerShell and `npm.cmd`; bare npm under Git Bash fails to resolve the npm shim.
- `npm run build` runs `astro check` (TypeScript) and builds the static site.
- GitHub Pages uses `site: https://imano177.github.io`, `base: /portfolio/`, and static output. Keep links/assets relative or prefix with `import.meta.env.BASE_URL`.
- The homepage is a self-contained retro-OS desktop in `src/pages/index.astro` (inline `is:global` styles, `is:inline` script). Asset files live in `public/` (`ghibli-hill.svg`, `assets/certificates/*.webp`, `favicon.svg`); reference them with page-relative paths so they resolve under the `/portfolio/` base.
