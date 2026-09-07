# Portfolio / SIGNAL_STATION

Static GitHub Pages portfolio for `[YOUR NAME]`. It uses plain HTML, CSS, and JavaScript, with Anime.js for the authored entrance/feedback motion and Three.js r185 for the interactive signal core.

## Quick setup

1. Replace the bracketed copy and placeholder links in `index.html`.
2. Create a public GitHub repository such as `portfolio`.
3. Copy the contents of this folder into the repository root.
4. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. Put the resulting URL into the `Portfolio` link in `github-profile/README.md`.

No build command or backend is required. Three.js is imported from a version-pinned CDN URL; if WebGL or a CDN is unavailable, the CSS signal-core fallback remains visible. The `prefers-reduced-motion` path keeps the content visible and disables auto-motion while preserving controls and status feedback.
