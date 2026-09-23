# ImAno177 — Duong Bach Chi

Astro + TypeScript portfolio for GitHub Pages. The site is a self-contained
Windows 95-style desktop ("retro-os"): draggable windows, desktop icons, a
Start menu, taskbar, and a certificate photo viewer — all in one page.

## Commands

```text
npm install
npm run dev
npm run build
```

The production URL is `https://imano177.github.io/portfolio/`. GitHub Actions
builds `dist/` and deploys it to GitHub Pages on pushes to `main`.

## Structure

- `src/pages/index.astro` — the whole retro desktop (HTML + `is:global` CSS + `is:inline` JS).
- `public/ghibli-hill.svg` — hand-drawn wallpaper.
- `public/assets/certificates/` — certificate images used by the viewer.
- `public/favicon.svg`, `public/robots.txt` — static files.
