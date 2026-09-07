# Portfolio / SIGNAL_STATION

Static GitHub Pages portfolio for ImAno177. It uses plain HTML, CSS, and JavaScript, with Anime.js for authored entrance/feedback motion and Three.js r185 for the interactive signal core.

## Quick setup

1. Create or use the public `portfolio` repository.
2. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
3. Keep the resulting URL in the `Portfolio` link in `github-profile/README.md`.

No build command or backend is required. Three.js is imported from a version-pinned CDN URL; if WebGL or a CDN is unavailable, the CSS signal-core fallback remains visible. The `prefers-reduced-motion` path keeps the content visible and disables auto-motion while preserving controls and status feedback.
