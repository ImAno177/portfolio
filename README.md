# ImAno177 / The Hillside Study

Astro + TypeScript + Three.js portfolio for GitHub Pages.

The homepage keeps all profile, project, CV, contact, and GitHub links in normal HTML. A lazy-loaded Three.js hillside adds draggable views, navigable objects, daylight/evening lighting and a pause control. Reduced motion renders on demand; offscreen and hidden scenes pause. An original SVG illustration remains available without JavaScript or WebGL. No external models, fonts, runtime APIs or backend are required.

## Commands

```text
npm install
npm run dev
npm run build
npm run test:browser
```

`test:browser` requires the dev server running at `http://127.0.0.1:4321/portfolio/` and an installed Chrome, Chromium or Edge. Pass another URL with `npm run test:browser -- http://127.0.0.1:4322/portfolio/`; set `BROWSER_EXECUTABLE` if automatic browser discovery does not match your installation. The dependency-free check uses an isolated temporary browser profile and prints screenshot paths. On Windows, use PowerShell with `npm.cmd` if Git Bash cannot resolve npm.

The production URL is `https://imano177.github.io/portfolio/`. GitHub Actions builds `dist/` and deploys it to GitHub Pages.

## Content and assets

- Edit profile data in `src/data/portfolio.ts`.
- The homepage uses `src/game/meadow-scene.ts`, `src/client/meadow-ui.ts`, and `src/styles/meadow.css`. Its fallback illustration is `public/assets/meadow.svg`.
- `prototypes/retro-os/` holds a self-contained HTML design prototype (Windows 95-style desktop); it is not part of the Astro build.
