# Cat Room repair — approved implementation

Current follow-up: `fix/room-layout-v2` rebuilds the room as the user-approved studio. See `docs/review/cat-room/review.md` for current evidence. The previous spatial approval below was superseded by user-reported furniture placement defects; it must not be reused as acceptance of the new room. The studio revision is not merged or deployed.

Branch: `fix/asset-cat-room`; baseline `759d1fb`. GitHub profile out of scope.

1. Atlas: implemented. Verified 352×1696 cat sheets, 32px cells, 11 columns. Aseprite contains a single sheet frame without animation tags; annotated sheet supplies clip mapping. 20 interior frames and 186 animation references pass bounds/alpha validation.
2. Static room: implemented. Fixed 640×360, shared scene data and generated fallback. Furniture footprints reviewed against crops; removed floating/cropped window, corrected shelf footprint, added two explicit sofa seats and approaches.
3. HTML shell: updated per user's latest game-screen request. Full viewport, three icon-only native-details menus, no persistent prose/header/footer. One HTML content source, hash panels and text fallback retained.
4. Movement: implemented. 16px A*, reserved destinations, direction clips, local actor detours and explicit sofa approach/ascent/descent. Visual confirmation shows both sleeping cats on separate cushions.
5. Simulation/save: integrated and tested. Cooldowns, action needs, validated saves, hourly offline reconciliation.
6. Sky/loading: implemented. Shared sky cropped into openings (Phaser4 WebGL does not support legacy setMask), seven lighting profiles, dynamic import, retry, pause/visibility handling.

Checks: 22 logic tests; 21 executable browser checks in scripts/browser-checks.mjs; Astro build passes. Desktop/mobile rendered and inspected. Independent final visual/furniture review resolved the remaining hotspot-resize, lamp-depth and balcony-entry findings. Local review repeated and fast-forward merge into main completed on 2026-09-08; 22 tests passed on main. Push, deployment and live verification remain pending.

Release gate: tests, static asset validation, browser interaction/accessibility checks, morning/sunset/night screenshots, then deploy and live verification. No main merge before this gate.
