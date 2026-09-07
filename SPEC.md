# Cat Room Portfolio — Product & Technical Specification

**Status:** Final design specification  
**Target:** Static personal portfolio deployed on GitHub Pages  
**Primary stack:** Astro + TypeScript + Tailwind CSS + Phaser 4  
**Experience:** A professional portfolio presented over a living pixel-art cat-room simulation

---

## 1. Product Overview

Build a personal portfolio website that remains a fast, accessible, SEO-friendly website while using a game-like pixel-art environment as its main visual identity.

The primary scene is a **single fixed room with floor-to-ceiling glass facing the sky and an attached covered balcony**. The room contains multiple autonomous cats, plants, furniture, and interactive objects. Cat behavior changes according to the **visitor's local time**, each cat's personality and needs, and previous visitor interactions.

The portfolio content itself must remain normal HTML/DOM content. Phaser is responsible for the simulated world, not for rendering long-form portfolio content.

The experience should feel like a small living world without forcing visitors to play a game in order to access essential information.

---

## 2. Product Goals

### 2.1 Primary goals

1. Create a distinctive portfolio suitable for software engineering, security, research, and ML-oriented applications.
2. Preserve excellent usability for recruiters and technical visitors.
3. Present a polished, cozy pixel-art room containing multiple cats.
4. Give cats believable, non-repetitive behavior driven by:
   - visitor-local time;
   - personality;
   - internal needs;
   - environment context;
   - previous interaction;
   - controlled randomness.
5. Support game-like interactions with cats and selected room objects.
6. Deploy entirely as a static site on GitHub Pages.
7. Reuse existing assets in the repository before acquiring new ones.
8. Allow missing assets to be sourced from itch.io and similar reputable asset libraries while preserving licensing and visual consistency.

### 2.2 Secondary goals

- Include tasteful easter eggs related to programming, security, research, or developer culture.
- Preserve lightweight state across visits without a backend.
- Support future seasonal cosmetics such as winter and Valentine's accessories.
- Keep the simulation modular so new cats, actions, props, and time-based events can be added without redesigning the entire system.

---

## 3. Non-Goals

The initial release is **not** intended to become:

- a full RPG or virtual-pet game;
- a scrolling or multi-room world;
- a multiplayer application;
- a backend-dependent simulation;
- a canvas-only website;
- an account/login system;
- a simulation that continuously runs while the browser is closed;
- an experience where portfolio content is hidden behind gameplay.

Offline progression should be reconstructed from elapsed time when the visitor returns.

---

## 4. Technology Stack

### 4.1 Required technologies

- **Astro** — static site framework and content shell
- **TypeScript** — site and simulation logic
- **Tailwind CSS** — interface and responsive styling
- **Phaser 4** — 2D rendering, sprite animation, input, world simulation
- **GitHub Actions** — CI/CD
- **GitHub Pages** — hosting
- **localStorage** — lightweight client-side persistence

### 4.2 High-level architecture

```text
Browser
├── Astro / DOM Layer
│   ├── navigation
│   ├── About
│   ├── Projects
│   ├── Research
│   ├── CV / Education
│   ├── Contact / external links
│   └── accessible panels / dialogs / drawers
│
└── Phaser World Layer
    ├── room
    ├── glass wall
    ├── sky
    ├── covered balcony
    ├── furniture
    ├── plants
    ├── cats
    ├── environment effects
    └── game-like interactions
```

### 4.3 Responsibility boundaries

**Astro/DOM owns:**
- semantic text;
- headings;
- links;
- project descriptions;
- research notes;
- CV content;
- navigation;
- dialogs and drawers;
- accessibility semantics;
- SEO metadata.

**Phaser owns:**
- scene composition;
- pixel-art rendering;
- sprite animation;
- cat movement;
- cat decision-making;
- object hotspots;
- visual reactions;
- environment transitions.

Important portfolio information must never exist only inside the Phaser canvas.

---

## 5. World and Scene Design

### 5.1 World model

Use **one fixed room** with a fixed camera. The world does not scroll into additional rooms.

The entire environment should remain visually understandable at a glance and scale with the viewport.

### 5.2 Core visual concept

The scene combines:

- a cozy indoor study/lounge room;
- floor-to-ceiling glass or a large glass wall;
- a prominent sky/cloud view;
- an attached balcony;
- a covered balcony roof, pergola, or awning;
- abundant indoor and balcony plants;
- multiple cat-friendly resting and play areas.

The environment should feel like a cozy apartment/studio overlooking a large open sky.

### 5.3 Required zones

#### Desk Zone

Contains:
- desk;
- laptop or monitor;
- lamp;
- books/papers;
- chair;
- mug and small props where appropriate.

Purpose:
- work/study visual identity;
- cat climbing/sitting behavior;
- primary **Projects** hotspot.

#### Bookshelf / Research Zone

Contains:
- bookshelf;
- books;
- small decorative items;
- plants;
- cat-accessible surfaces.

Purpose:
- visual identity for research and technical reading;
- primary **Research / Notes** hotspot.

#### Sofa / Rest Zone

Contains:
- sofa;
- cushions/poufs;
- rug or cat bed.

Purpose:
- sleeping;
- grooming;
- low-energy social behavior.

#### Food & Water Zone

Contains:
- food bowl;
- water bowl;
- feeding mat or related props.

Purpose:
- eating behavior;
- visitor feeding interaction.

#### Play Zone

Contains:
- open floor or rug;
- ball, toy, teaser, or similar props.

Purpose:
- play behavior;
- chasing;
- short zoomies;
- visitor-driven play.

#### Plant Zone

Contains:
- floor plants;
- shelf plants;
- hanging plants;
- balcony vegetation.

Purpose:
- visual depth;
- sniffing/observing behaviors;
- occasional mischievous interactions.

#### Glass / Window Ledge Zone

Contains:
- large windows or glass wall;
- ledge or sitting area.

Purpose:
- sky observation;
- sunrise/sunset behavior;
- visual transition between room and balcony.

#### Covered Balcony Zone

Contains:
- railing;
- roof/pergola/awning;
- hanging plants;
- optional string lights;
- small chair/table or resting spot.

Purpose:
- strong time-of-day atmosphere;
- sky watching;
- evening idle behavior;
- scenic cat behavior.

#### CV / Information Hotspot

Represented by one visually appropriate object, such as:
- notice board;
- framed board;
- pinned-paper wall;
- wall display.

Purpose:
- open **CV / Education / Contact** content.

---

## 6. Visual Direction

### 6.1 Art style

- Pixel art
- Primarily 16x16 and 32x32-derived visual language
- Crisp nearest-neighbor scaling
- No texture smoothing that blurs pixel edges
- Cozy, calm, and warm
- Abundant greenery
- Dream-like sky/cloud backdrop
- Clear silhouette separation

### 6.2 Composition

Keep the room visually detailed around the edges while preserving readable walkable space through the center.

Do not fill every open area with furniture or cats.

The scene must remain readable underneath DOM overlays.

### 6.3 Time-of-day presentation

The room and outdoor view should visibly reflect the visitor's local time.

| Local time | Visual state |
|---|---|
| 05:00–09:00 | soft morning light |
| 09:00–12:00 | clear daylight |
| 12:00–15:00 | bright, calm midday |
| 15:00–18:00 | warm afternoon |
| 18:00–20:00 | sunset |
| 20:00–00:00 | cozy artificial lighting |
| 00:00–05:00 | night sky and low interior light |

Where practical, transitions should interpolate gradually instead of switching abruptly at exact time boundaries.

---

## 7. Asset Strategy

### 7.1 Existing assets are the first source of truth

Before downloading, generating, or replacing any asset, the implementation must inspect the repository's existing **`assets/`** directory.

The developer must inventory available assets and determine:

- asset category;
- dimensions;
- frame layout;
- animation names;
- palette and outline style;
- perspective;
- license;
- attribution requirements;
- whether the asset is needed in the production build.

Expected categories may include:
- cat sprite sheets;
- cat animation sheets;
- plant sprites;
- interior/furniture assets;
- sky/cloud backgrounds;
- seasonal accessories.

Do not assume exact filenames. Inspect the actual repository contents.

### 7.2 Asset manifest

Maintain a machine-readable or human-readable asset manifest, for example:

```text
src/content/assets-manifest.yaml
```

Each third-party pack should record at least:

```yaml
id: kitten-pack
source: https://example.com/asset-page
author: Example Author
license: "Creator license / license identifier"
commercial_use: true
modification_allowed: true
redistribution_allowed: false
attribution_required: false
local_path: public/assets/cats/
used_for:
  - cats
notes: "Original pack retained only outside production output if redistribution is restricted."
```

The manifest is part of the project's development and licensing record.

### 7.3 Missing-asset acquisition policy

If a required visual element is missing from `assets/`, search external asset marketplaces and libraries.

Preferred search order:

1. **itch.io**
2. **OpenGameArt**
3. **Kenney**
4. **CraftPix**
5. creator-owned storefronts or other reputable pixel-art libraries

Other sources are acceptable only when provenance and licensing are clear.

### 7.4 Search requirements

When sourcing missing art, prioritize:

1. visual compatibility with the existing scene;
2. matching 16x16 or 32x32 pixel-art scale;
3. matching camera angle/perspective;
4. transparent PNG, spritesheet, or editable source where appropriate;
5. explicit personal/commercial-use permission;
6. clear redistribution restrictions;
7. palette compatibility;
8. reasonable runtime size;
9. creator-owned/original sources rather than mirrors or reuploads.

### 7.5 Licensing requirements

Before adding any external asset:

- read the actual creator license or usage terms;
- record the source URL;
- record the author/creator;
- record whether commercial use is allowed;
- record whether modification is allowed;
- record whether attribution is required;
- record redistribution restrictions.

**Do not use an asset if its license is ambiguous.**

Do not redistribute full original asset packs or editable source files unless the license explicitly permits it.

Only production files required by the website should be shipped publicly.

### 7.6 Visual compatibility rule

Do not add an asset merely because it looks attractive in isolation.

New assets must match:
- perspective;
- pixel density;
- outline style;
- lighting direction;
- palette;
- proportions.

If an otherwise suitable asset requires palette or pixel-level adjustment, modifications are allowed only when the license permits them.

### 7.7 Development-time sourcing only

The production website must **not dynamically fetch marketplace assets from itch.io or similar sites at runtime**.

Asset discovery and acquisition happen during development. Approved assets are stored locally in the project and deployed with the static build.

---

## 8. Cat Simulation Model

### 8.1 Cat agent

Each cat is an independent agent.

Suggested model:

```ts
interface CatAgent {
  id: string
  name: string
  spriteVariant: string

  personality: CatPersonality
  needs: CatNeeds

  currentState: CatState
  currentZone?: ZoneId
  targetZone?: ZoneId

  friendship: number
  lastInteractionAt?: number
}
```

### 8.2 Personality

Each cat should have recognizably different tendencies.

Suggested traits:

```ts
interface CatPersonality {
  sleepiness: number
  curiosity: number
  socialness: number
  playfulness: number
  foodMotivation: number
  independence: number
  chaos: number
}
```

Use normalized values such as `0.0–1.0`.

Personality modifies behavior probabilities rather than acting as a rigid script.

### 8.3 Needs

Suggested needs:

```ts
interface CatNeeds {
  energy: number
  hunger: number
  social: number
  fun: number
  comfort: number
}
```

Needs change over simulated time and in response to actions.

### 8.4 Minimum state set

MVP states:

- `idle`
- `walk`
- `sit`
- `sleep`
- `groom`
- `eat`
- `observe`
- `play`
- `react`
- `meow`

Optional states:
- `hiss`
- `hide`
- `stretch`
- `zoomies`
- `scratch`
- `paw`
- `investigate`

### 8.5 Decision model

Do not implement behavior as a rigid timetable.

Use a weighted action-selection model:

```text
visitor-local time
        +
current needs
        +
personality
        +
zone availability
        +
recent actions
        +
bounded randomness
        ↓
candidate action scores
        ↓
selected action
```

Example:

```text
sleepScore =
  lowEnergyWeight
+ nighttimeWeight
+ sleepinessTrait
+ restZoneBonus
- recentSleepPenalty
```

This should produce recognizable routines without deterministic repetition.

### 8.6 Anti-chaos safeguards

The behavior system must include:
- minimum state duration;
- action cooldowns;
- hysteresis or switching penalties;
- zone occupancy checks where relevant;
- bounded random variation.

Cats must not change actions every frame or rapidly oscillate between destinations.

---

## 9. Visitor-Local Time Behavior

### 9.1 Time source

Use the visitor's browser-local clock:

```ts
new Date()
```

Do not force a fixed timezone.

### 9.2 Behavioral schedule

#### 05:00–09:00 — Morning
Higher probability of:
- waking;
- stretching;
- eating;
- observing the sky;
- light exploration.

#### 09:00–12:00 — Active Morning
Higher probability of:
- walking;
- playing;
- social behavior;
- desk/bookshelf exploration.

#### 12:00–15:00 — Midday Calm
Higher probability of:
- sleeping;
- grooming;
- sitting;
- low movement.

#### 15:00–18:00 — Afternoon Activity
Higher probability of:
- play;
- exploration;
- social interaction.

#### 18:00–20:00 — Sunset
Higher probability of:
- balcony visits;
- window watching;
- sitting;
- calm social behavior.

#### 20:00–00:00 — Evening
Higher probability of:
- resting;
- grooming;
- indoor social behavior;
- sleeping.

#### 00:00–05:00 — Night
Higher probability of:
- sleeping.

Very low-probability special behavior:
- quiet wandering;
- brief zoomies;
- looking outside;
- short play.

Night behavior should remain charming rather than disruptive.

---

## 10. Visitor Interaction

### 10.1 Cat interactions

Required MVP interactions:

#### Pet / Click

Possible reactions:
- look toward cursor;
- purr;
- meow;
- tail movement;
- approach the pointer;
- mildly annoyed response depending on personality/state.

#### Feed

The visitor can use the food area to trigger feeding.

Effects may include:
- hunger reduction;
- temporary attraction to the food zone;
- friendship increase subject to cooldown.

#### Play

The visitor can activate a toy.

Effects:
- playful cats may chase or pounce;
- `fun` increases;
- tired or independent cats may ignore the interaction.

#### Call

Optional for MVP; preferred for polished release.

Whether a cat approaches depends on:
- socialness;
- friendship;
- current action;
- distance;
- needs.

### 10.2 Cursor awareness

Selected cats may:
- glance toward the cursor;
- investigate slow movement;
- chase only when an explicit play interaction is active.

Do not make every cat constantly track the pointer.

### 10.3 Interaction cooldowns

Repeated clicking must not:
- stack audio rapidly;
- restart animations every frame;
- inflate friendship without limits;
- continuously interrupt important actions.

---

## 11. Portfolio Hotspots

Room objects are optional discovery shortcuts.

| Scene object | Portfolio action |
|---|---|
| Laptop / work desk | Projects |
| Bookshelf | Research / Notes |
| Notice board / wall board | CV / Education |
| Window or another deliberate prop | About |
| Dedicated icon, terminal, or device | GitHub |

Each hotspot must:
- provide hover/focus feedback;
- trigger an accessible DOM panel or normal route;
- have an equivalent ordinary navigation control;
- never be the sole route to important content.

---

## 12. Portfolio Information Architecture

Required content sections:

- Home / Introduction
- About
- Projects
- Research / Notes
- CV / Education
- Contact / Links
- GitHub

### Display model

Use accessible DOM:
- drawers;
- panels;
- dialogs;
- cards.

The scene should remain visible behind or around the content.

### Recruiter usability requirement

A first-time visitor should be able to identify:
- who the portfolio belongs to;
- the owner's main technical interests;
- strongest projects;
- GitHub;
- CV/contact information;

within a few seconds, without first learning the cat simulation.

---

## 13. Persistence and Offline Progression

### 13.1 Storage

Use `localStorage`.

Suggested shape:

```ts
interface PortfolioSave {
  schemaVersion: number
  lastVisitAt: number

  cats: Record<string, {
    friendship: number
    timesPetted: number
    timesFed: number
    timesPlayed: number
  }>

  preferences: {
    muted: boolean
    reducedMotion?: boolean
  }
}
```

### 13.2 Offline progression

When the visitor returns:

```text
elapsed = currentTime - lastVisitAt
```

Do not replay every missed frame/tick.

Instead calculate a bounded approximation for:
- energy recovery;
- hunger increase;
- likely current state;
- time-of-day preference.

### 13.3 Save migration

Use `schemaVersion`.

Future versions must handle:
- missing fields;
- old save formats;
- corrupted localStorage.

Fallback safely to defaults.

---

## 14. Audio

Audio is optional for the first milestone but recommended for the polished release.

Possible audio:
- subtle meows;
- purring;
- toy sounds;
- UI feedback;
- quiet balcony ambience.

Requirements:
- obvious mute control;
- no aggressive autoplay;
- no audio spam;
- conservative volume;
- audio initialization only after a valid user interaction when browser policy requires it.

---

## 15. Responsive Design

### 15.1 Desktop

Desktop/laptop is the primary art-direction target.

The fixed room should occupy the available viewport while retaining clear composition.

### 15.2 Mobile

The portfolio must remain fully usable.

Possible adaptations:
- reduce active cat count;
- simplify optional effects;
- prioritize DOM content;
- resize/reposition the canvas;
- enlarge interactive targets;
- reduce expensive animation.

Do not require world scrolling to access portfolio information.

---

## 16. Accessibility

Requirements:
- semantic HTML for all portfolio information;
- keyboard-accessible navigation;
- visible focus styles;
- accessible names for controls;
- sufficient text contrast;
- support for `prefers-reduced-motion`;
- user control to reduce/disable decorative motion;
- DOM alternatives for every portfolio hotspot.

The cat simulation may be decorative/game-like, but no essential information may depend on seeing or interacting with it.

---

## 17. Performance Requirements

### 17.1 General target

The site should feel responsive on a normal laptop and remain usable on mid-range mobile hardware.

### 17.2 Required optimizations

- sprite sheets/atlases where practical;
- nearest-neighbor rendering;
- production-only asset selection;
- compressed large backgrounds;
- no unnecessary oversized textures;
- bounded active-cat count;
- reduced/pause simulation when the tab is hidden;
- elapsed-time reconciliation on resume;
- avoid unnecessary per-frame memory allocation.

### 17.3 Initial cat count

Target **6–8 active cats** in the first release.

The architecture may support more later, but readability and performance take priority.

---

## 18. Suggested Project Structure

```text
/
├── public/
│   └── assets/
│       ├── cats/
│       ├── room/
│       ├── balcony/
│       ├── plants/
│       ├── sky/
│       ├── props/
│       ├── audio/
│       └── seasonal/
│
├── src/
│   ├── components/
│   │   ├── portfolio/
│   │   └── ui/
│   │
│   ├── content/
│   │   ├── projects/
│   │   ├── research/
│   │   └── assets-manifest.yaml
│   │
│   ├── game/
│   │   ├── config/
│   │   ├── scenes/
│   │   ├── cats/
│   │   │   ├── CatAgent.ts
│   │   │   ├── CatNeeds.ts
│   │   │   ├── CatPersonality.ts
│   │   │   ├── CatDecisionSystem.ts
│   │   │   └── CatStateMachine.ts
│   │   ├── world/
│   │   │   ├── zones.ts
│   │   │   ├── hotspots.ts
│   │   │   └── navigation.ts
│   │   ├── systems/
│   │   │   ├── TimeSystem.ts
│   │   │   ├── InteractionSystem.ts
│   │   │   ├── PersistenceSystem.ts
│   │   │   └── EnvironmentSystem.ts
│   │   └── data/
│   │       └── cats.ts
│   │
│   ├── layouts/
│   ├── pages/
│   └── styles/
│
├── docs/
│   └── asset-licenses/
│
├── astro.config.*
└── package.json
```

Exact filenames may evolve, but rendering, simulation, portfolio UI, and asset metadata should remain clearly separated.

---

## 19. Development Phases

### Phase 1 — Portfolio Shell
Deliver:
- Astro project;
- main navigation;
- portfolio content structure;
- responsive DOM layout;
- GitHub Pages deployment.

### Phase 2 — Asset Audit and Static Scene
Deliver:
- audit of existing `assets/`;
- asset manifest;
- licensing notes;
- Phaser integration;
- fixed room;
- glass wall;
- sky;
- covered balcony;
- room props;
- plants.

If required scene elements are absent, source compatible assets according to Section 7.

### Phase 3 — Cat Animation
Deliver:
- 6–8 cats;
- sprite animation;
- basic movement;
- idle/walk/sit/sleep/eat/observe.

### Phase 4 — Simulation
Deliver:
- personality;
- needs;
- visitor-local time system;
- weighted decision-making;
- zone selection;
- cooldowns.

### Phase 5 — Interaction
Deliver:
- pet;
- feed;
- play;
- cat reactions;
- portfolio hotspots.

### Phase 6 — Persistence
Deliver:
- localStorage save;
- friendship;
- visit timestamps;
- offline progression;
- migration/fallback logic.

### Phase 7 — Polish
Deliver:
- time-of-day lighting;
- sky transitions;
- optional audio;
- responsive optimization;
- accessibility pass;
- performance pass.

### Phase 8 — Optional Expansion
Potential additions:
- seasonal cosmetics;
- achievements;
- named-cat bios;
- developer/security easter eggs;
- ambient events;
- additional interaction variety.

---

## 20. Testing Requirements

### 20.1 Unit tests

Prioritize pure simulation logic:
- time block calculation;
- action scoring;
- need changes;
- cooldowns;
- offline progression;
- save migration.

### 20.2 Integration tests

Verify:
- Phaser mounts/unmounts correctly;
- DOM panels open from hotspots;
- ordinary navigation works without Phaser;
- localStorage errors do not break the site.

### 20.3 Manual visual testing

Required viewport classes:
- large desktop;
- laptop;
- tablet;
- modern mobile.

Verify:
- cats do not traverse blocked geometry;
- important props remain visible;
- overlays remain readable;
- scene scaling preserves pixel sharpness.

### 20.4 Time simulation testing

Development builds must support overriding the perceived local hour so morning, daytime, sunset, evening, and night states can be tested immediately.

This override must not affect normal production visitors.

---

## 21. Error Handling and Fallbacks

If Phaser fails:
- the Astro portfolio still renders and remains fully navigable.

If an optional asset fails:
- do not crash the application;
- emit useful development diagnostics;
- skip or replace the missing decorative element.

If localStorage is unavailable:
- use temporary in-memory state.

If reduced motion is requested:
- significantly reduce decorative movement and animation intensity.

---

## 22. Deployment

The project must build to static output compatible with GitHub Pages.

```text
git push
    ↓
GitHub Actions
    ↓
Astro build
    ↓
static output
    ↓
GitHub Pages
```

Requirements:
- correct Astro base configuration for repository-based Pages deployment;
- no backend;
- no dependence on local development paths;
- all production assets served from static project paths.

---

## 23. Acceptance Criteria

The polished first release is complete when:

- [ ] The portfolio deploys successfully to GitHub Pages.
- [ ] Portfolio content remains fully usable as standard HTML if Phaser is disabled or fails.
- [ ] The main world is one fixed room.
- [ ] The room includes a large glass sky view.
- [ ] The room includes an attached covered balcony.
- [ ] Existing repository `assets/` were audited before acquiring replacements.
- [ ] Every third-party asset has provenance and licensing recorded.
- [ ] Missing required assets were sourced from itch.io or another reputable asset library only when needed.
- [ ] The production site does not fetch marketplace assets dynamically.
- [ ] The scene contains 6–8 active cats.
- [ ] Cats have visibly different personalities.
- [ ] Cats have internal needs.
- [ ] Cat behavior changes according to visitor-local time.
- [ ] Cat actions use weighted, non-deterministic selection rather than a rigid loop.
- [ ] Cats can sleep, walk, sit, eat, observe, groom, and play.
- [ ] The visitor can pet, feed, and play with cats.
- [ ] At least four room objects work as portfolio hotspots.
- [ ] Every hotspot destination is also available through normal navigation.
- [ ] Basic cat friendship/interaction state persists locally.
- [ ] Offline elapsed time is reconciled on return.
- [ ] Time of day visibly affects the environment.
- [ ] Mobile remains usable.
- [ ] Reduced-motion preferences are respected.
- [ ] Scene performance is acceptable on a normal laptop and mid-range mobile device.

---

## 24. Final Product Statement

> Build a static personal portfolio using **Astro, TypeScript, Tailwind CSS, and Phaser 4**, deployed on **GitHub Pages**. The portfolio is presented over a fixed pixel-art room with floor-to-ceiling glass facing the sky and an attached covered balcony. The world contains plants, furniture, interactive portfolio objects, and 6–8 autonomous cats.
>
> Each cat has an individual personality, internal needs, persistent friendship state, and a weighted behavior model influenced by the **visitor's local time**. Visitors can pet, feed, and play with cats while using room objects as optional shortcuts to Projects, Research, About, CV, and GitHub content.
>
> The repository's existing **`assets/` directory must always be inspected and reused first**. When required artwork is missing, the implementation should search **itch.io first**, then reputable alternatives such as **OpenGameArt, Kenney, CraftPix, and creator-owned asset stores**. Every acquired asset must have clear provenance and licensing recorded before use.
>
> The simulation is an enhancement layer. The portfolio itself must remain fast, accessible, SEO-friendly, and fully usable as standard HTML even if the Phaser layer is unavailable.
