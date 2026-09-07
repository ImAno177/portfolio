# Cat Room Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the previous Signal Station page with a static Astro portfolio whose accessible DOM content is wrapped by a fixed pixel-art cat room powered by Phaser 4.

**Architecture:** Astro owns semantic portfolio content, navigation, dialogs, metadata, and fallback rendering. A client-side Phaser scene owns the fixed room, sky, furniture, six cats, hotspots, and visual reactions. Pure TypeScript simulation modules own time blocks, needs, weighted decisions, cooldowns, persistence, and offline reconciliation so they can be tested without Phaser.

**Tech Stack:** Astro 7, TypeScript, Tailwind CSS 4 via `@tailwindcss/vite`, Phaser 4.2, Vitest, GitHub Actions, GitHub Pages, localStorage.

**Spec:** `D:\research-new\portfolio\SPEC.md`

## Global Constraints

- The production site is static and deploys to GitHub Pages at `/portfolio/`.
- Astro/DOM keeps every essential portfolio fact accessible when Phaser, WebGL, remote assets, or motion fail.
- The world is one fixed room with a glass sky wall and covered balcony; it does not scroll into more rooms.
- Existing `assets/` is audited and reused before any new asset; no marketplace asset is fetched at runtime.
- Six active cats use local sprite assets, distinct personality traits, needs, weighted decisions, local-time behavior, cooldowns, interaction state, and localStorage persistence.
- Normal DOM navigation duplicates every room hotspot destination.
- `prefers-reduced-motion`, mobile usability, visible focus, semantic links, and contrast are required.
- Do not stage or delete the user's existing `assets/` archive.

---

### Task 1: Replace static shell with Astro/Tailwind toolchain

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.github/workflows/deploy.yml`
- Create: `src/layouts/Layout.astro`, `src/pages/index.astro`, `src/styles/global.css`
- Modify: `README.md`
- Remove: root `index.html`, `styles.css`, `script.js` after the Astro route is ready

**Interfaces:**
- `Layout.astro` receives `title`, `description`, and `canonicalPath` and emits GitHub Pages-safe metadata.
- `index.astro` renders normal DOM sections and mounts the client room through `src/game/cat-room.ts`.

- [ ] Add pinned Astro, Tailwind/Vite, Phaser, TypeScript, Vitest, and Astro check/build scripts.
- [ ] Configure Astro `site` and `base: "/portfolio/"` for repository Pages deployment.
- [ ] Add the static Pages workflow with Node setup, `npm ci`, `npm run check`, `npm test`, `npm run build`, and Pages artifact deployment.
- [ ] Create the semantic page shell with navigation for Home, About, Projects, Research, CV, Contact, and GitHub.
- [ ] Add a no-JavaScript fallback notice and a live region for cat-room status.
- [ ] Add Tailwind import plus custom pixel-room tokens without rounded cards or generic glassmorphism.
- [ ] Run `npm install`, `npm run check`, and `npm run build` after the initial shell.

### Task 2: Audit and package existing assets

**Files:**
- Create: `src/content/assets-manifest.yaml`, `docs/asset-licenses/README.md`
- Create: `public/assets/cats/`, `public/assets/sky/`, `public/assets/interior/`, `public/assets/reference/`
- Preserve: `assets/` source archive unchanged

**Interfaces:**
- `assets-manifest.yaml` records source path, production path, creator/source, license status, usage, and redistribution note for every shipped raster.
- `src/data/assets.ts` exports only browser-shippable production paths and labels used by the asset shelf.

- [ ] Copy the supplied cat sprite PNG variants, all four background families and their layer PNGs, and all top-down interior PNGs into stable lowercase `public/assets` paths.
- [ ] Keep Aseprite, PSD, palette, PDF, URL, and license files in the source archive; record each in the manifest as source-only or documentation evidence.
- [ ] Record CraftPix freebie provenance and license URL from the supplied files; record the cat/interior packs as user-supplied with provenance status explicitly marked unverified rather than inventing a license.
- [ ] Add a visible, collapsible asset shelf that uses every shipped PNG as a visual reference without exposing editable source files as downloadable production assets.
- [ ] Validate every copied raster exists and every manifest production path resolves.

### Task 3: Build tested pure cat simulation

**Files:**
- Create: `src/game/types.ts`, `src/game/data/cats.ts`, `src/game/simulation.ts`, `src/game/persistence.ts`
- Create: `src/game/simulation.test.ts`, `src/game/persistence.test.ts`

**Interfaces:**
- `getTimeBlock(hour: number): TimeBlock`
- `getTimeProfile(block: TimeBlock): TimeProfile`
- `scoreActions(cat: CatAgent, context: DecisionContext): ActionScore[]`
- `chooseAction(scores: ActionScore[], random: () => number): CatAction`
- `advanceNeeds(needs, minutes, profile): CatNeeds`
- `reconcileOffline(save, now): PortfolioSave`
- `loadSave(raw, fallbackNow): PortfolioSave`
- `saveState(save, storage): void`

- [ ] Write failing tests for all seven local-time blocks, boundary hours, weighted choice, switching penalty, minimum state duration, needs changes, corrupted save fallback, schema migration, and bounded offline progression.
- [ ] Run the focused tests and confirm they fail because the simulation modules do not exist.
- [ ] Implement normalized cat traits, needs, action scores, cooldowns, hysteresis, bounded randomness, and six distinct cat profiles.
- [ ] Implement local-time profiles for morning/day/midday/afternoon/sunset/evening/night.
- [ ] Implement save schema version 1, safe localStorage handling, interaction counters, friendship caps, and elapsed-time reconciliation.
- [ ] Run focused tests, then the complete test suite, and refactor only while green.

### Task 4: Implement Phaser fixed-room scene

**Files:**
- Create: `src/game/cat-room.ts`, `src/game/room-scene.ts`
- Modify: `src/data/assets.ts`, `src/pages/index.astro`

**Interfaces:**
- `mountCatRoom(root: HTMLElement, options: CatRoomOptions): () => void`
- `CatRoomOptions` exposes `onHotspot(id)`, `onCatInteraction(id, action)`, `onStatus(message)`, and `reducedMotion`.
- `RoomScene` owns one fixed camera and receives a `SimulationBridge` rather than DOM selectors.

- [ ] Create a fixed Phaser canvas with pixel-art nearest-neighbor rendering and responsive scale mode.
- [ ] Draw one room: glass wall, sky view, attached covered balcony, desk/laptop, bookshelf, sofa/rest zone, food/water, play rug, plant zone, window ledge, and CV board.
- [ ] Load the copied sky/background and cat sprite assets; use six cats with varied sprite variant, tint, scale, and personality.
- [ ] Render walkable zones and keep cats inside bounded paths with minimum state duration and target cooldowns.
- [ ] Use local time to tint sky/interior light and select time profiles; interpolate environment color rather than hard switching.
- [ ] Add explicit hotspot regions with pointer/focus feedback and emit normal DOM panel events.
- [ ] Add pet/feed/play/call controls and scene feedback; keep audio optional and muted by default.
- [ ] Pause or reduce the simulation when hidden, apply reduced-motion behavior, and destroy Phaser cleanly.
- [ ] Add a CSS/DOM fallback when Phaser import or scene creation fails.

### Task 5: Wire DOM panels, hotspots, persistence, and asset shelf

**Files:**
- Create: `src/client/portfolio-ui.ts`, `src/components/PortfolioPanel.astro`, `src/components/AssetShelf.astro`
- Modify: `src/pages/index.astro`, `src/styles/global.css`

**Interfaces:**
- `openPanel(id: PanelId): void` and `closePanel(): void`
- Panel IDs: `about`, `projects`, `research`, `cv`, `contact`, `github`.
- DOM navigation and Phaser hotspot events call the same `openPanel` function.

- [ ] Add accessible dialogs/drawers for About, Projects, Research, CV/Education, Contact, and GitHub content.
- [ ] Ensure room hotspots have focusable DOM equivalents and every external route is a normal link.
- [ ] Connect pet/feed/play/call UI to persistence and live status feedback.
- [ ] Add time-of-day label, mute control, reduced-motion control, and last-visit summary.
- [ ] Render the asset shelf with all shipped PNG references and license/provenance links.
- [ ] Keep recruiter path visible in the first DOM viewport: name, role, strongest projects, GitHub, CV/contact.
- [ ] Test keyboard navigation, dialog close, Escape, focus return, no-JS content, and reduced-motion mode.

### Task 6: Verify, document, and deploy

**Files:**
- Modify: `README.md`, `PRODUCT.md`, `DESIGN.md`
- Create: `docs/testing/cat-room-checklist.md`

- [ ] Run TypeScript checks, unit tests, build, manifest path validation, and `git diff --check`.
- [ ] Run a local server and inspect large desktop, laptop, tablet, and modern mobile viewports.
- [ ] Verify time override test mode, six cats, hotspot panel access, localStorage fallback, hidden-tab pause, and Phaser failure fallback.
- [ ] Run Lighthouse/accessibility checks and the Impeccable detector once after UI edits.
- [ ] Confirm GitHub Pages output has `/portfolio/` asset URLs and no marketplace runtime requests.
- [ ] Commit the new implementation without staging the source `assets/` archive unless explicitly requested.
- [ ] Push `main` and verify the public Pages URL.

