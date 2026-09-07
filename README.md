# ImAno177 / Cat Room Portfolio

Astro + TypeScript + Tailwind CSS + Phaser 4 portfolio for GitHub Pages.

The page keeps all profile, project, research, CV, contact, and GitHub links in normal HTML. Phaser only renders the fixed pixel-art room and autonomous cats. Cat needs, visitor interactions, reduced-motion preference, and bounded offline progression are stored in `localStorage`.

## Commands

```text
npm install
npm run dev
npm test
npm run validate:assets
npm run build
```

The production URL is `https://imano177.github.io/portfolio/`. GitHub Actions builds `dist/` and deploys it to GitHub Pages.

## Content and assets

- Edit profile data in `src/data/portfolio.ts`.
- Edit cat seeds and behavior in `src/game/data/cats.ts` and `src/game/simulation.ts`.
- Supplied raster assets are listed in the in-page **asset shelf** and tracked in `src/data/assets.ts`.
- Provenance notes live in `docs/asset-licenses/README.md`; the supplied cat/interior packs remain marked unverified until their original licenses are confirmed.
- `SPEC.md` is the product source of truth for this implementation.
