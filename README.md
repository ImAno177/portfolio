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
- Atlas crops and verified animation clips live in `src/game/data/atlas.json`; room objects, footprints, zone slots and hotspots share `src/game/data/room.json`.
- Run `node scripts/validate-assets.mjs --render` after changing scene data to regenerate the static fallback. The validator checks bounds, alpha content and animation references.
- Inspect sprites and looping clips at `/portfolio/dev/atlas/` in development only. Use `?hour=9`, `?hour=18`, or `?hour=1` to inspect lighting (override is disabled in production).
- The room uses only supplied artwork. Annotated sheets, frame indexes, coupons and editable files are source-only; there is no public asset shelf.
- Provenance notes live in `docs/asset-licenses/README.md`; the supplied cat/interior packs remain marked unverified until their original licenses are confirmed.
- `SPEC.md` is the product source of truth for this implementation.

## Room controls and fallback

The studio groups a complete kitchen, dining area, wall-backed reading nook, window workstation, balcony and lounge. Floor walkability and walls are authored in `src/game/data/room.json`, alongside furniture footprints and cat approaches. The refrigerator hotspot opens/closes the supplied alternate sprite; it is keyboard-accessible and pauses with the room. Appliances and furniture use original atlas artwork, not drawn stand-ins.

The default screen is the full-viewport game room. The top-left icon opens portfolio navigation, the top-right opens room settings, and the cat icon opens keyboard-accessible cat controls. Clicking a cat opens its controls automatically. Persistent header/status/footer prose is intentionally absent.

Use the navigation or room markers to open a section. Hash links such as `#projects` work on refresh. Escape closes the panel and restores focus. Text version displays the same HTML sections in document flow; it also works without JavaScript.

Choose any of six cats with the keyboard or click its sprite. Pet, feed, play and call have a cooldown. Feeding and play begin after the cat reaches its destination. Pause stops simulation; gentle motion slows movement and animation without teleporting. Progress is stored locally, with at most 24 hours of offline progression.

Renderer/import/asset failures keep the rendered-room fallback and text content visible, with a retry button. Email opens a mail client; Discord copies the username without inventing a numeric profile ID.

For a repeatable integration check, open the local development page and run `await (await import('/portfolio/scripts/browser-checks.mjs')).runRoomChecks()` in the browser console. Run this in a disposable development browser profile: it manipulates cat positions and local progress as test fixtures. This script is not included in the production site.
