---
name: Warm Atlas Room
description: A full-viewport pixel-art room that opens the portfolio on demand.
colors:
  room-canvas: "#211a16"
  page-canvas: "#211c1a"
  text: "#eadfcd"
  control-text: "#f1e5d0"
  control-surface: "#302720"
  room-surface: "#30231e"
  menu-icon-surface: "#30231ee8"
  menu-surface: "#30231ef5"
  panel-surface: "#29221df7"
  line: "#51423a"
  accent: "#edbe80"
  focus: "#ffcd8f"
  hotspot: "#fff0c5"
typography:
  interface:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
  content:
    fontFamily: "system-ui, sans-serif"
    lineHeight: 1.75
  content-heading:
    fontFamily: "Georgia, serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.15
  content-heading-mobile:
    fontSize: "34px"
rounded:
  control: "4px"
  icon-menu: "5px"
  cat-panel: "6px"
  content-panel: "8px"
spacing:
  control: "9px 12px"
  room-offset: "16px"
  panel: "24px"
  dialog: "24px 30px"
  mobile-dialog: "18px 22px"
components:
  control:
    backgroundColor: "{colors.control-surface}"
    textColor: "{colors.control-text}"
    rounded: "{rounded.control}"
    padding: "{spacing.control}"
  icon-menu:
    backgroundColor: "{colors.menu-icon-surface}"
    textColor: "{colors.control-text}"
    rounded: "{rounded.icon-menu}"
    size: "44px"
  room-hotspot:
    size: "32px"
  content-panel:
    backgroundColor: "{colors.panel-surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.content-panel}"
    padding: "{spacing.panel}"
---

# Design System: Warm Atlas Room

## Overview

**Creative North Star: "The Warm Atlas Room"**

The portfolio is a full-viewport web-game room built from the existing pixel-art world. The room, rather than a persistent header, hero, or text dashboard, owns the first view. Warm brown surfaces, cream type, gold accents, and hard pixel edges frame the existing studio scene without competing with it.

The world is authored at 640x360 and fitted as a whole with FIT/contain behavior, preserving the atlas and letterboxing when a viewport is narrower or differently shaped. Room coordinates drive hotspots. World foot-depth remains a world-space concern, while the lamp's lighting glow stays a separate visual layer. Portfolio information remains ordinary DOM and is reachable through hashes, the text view, native details menus, and the dialog.

**Key Characteristics:**
- Full-viewport 640x360 pixel-art room
- On-demand native details icon menus
- Hash-addressable DOM content and dialog panels
- Separate world foot-depth and lamp-light glow

## Colors

The palette is warm and low-luminance; the existing art carries most of the color while controls use cream, tan, and gold for discoverability.

### Primary
- **Warm accent** (`#edbe80`): hover borders and the room's active/link accent.
- **Keyboard focus** (`#ffcd8f`): the visible focus outline for keyboard users.

### Neutral
- **Room canvas** (`#211a16`): the full-viewport game-shell background.
- **Page canvas** (`#211c1a`): the base page and fullscreen-stage background.
- **Room surface** (`#30231e`): fallback room framing and warm control surfaces.
- **Menu surfaces** (`#30231ee8`, `#30231ef5`): translucent icon and expanded menus.
- **Panel surface** (`#29221df7`): the on-demand portfolio content panel.
- **Text** (`#eadfcd`): primary page and panel copy.
- **Control text** (`#f1e5d0`): menu and button labels.
- **Structural line** (`#51423a`): controls and content separators.
- **Hotspot light** (`#fff0c5`): the small discoverability point for room objects.

## Typography

**Interface Font:** `ui-monospace, SFMono-Regular, Consolas, monospace`
**Content Font:** `system-ui, sans-serif`
**Content Heading Font:** `Georgia, serif`

**Character:** Room controls, labels, and metadata stay compact and monospaced. The accessible text view uses a readable system sans body and restrained serif headings; there is no persistent display or hero type treatment.

### Hierarchy
- **Content heading** (400, 40px, 1.15): headings inside the on-demand portfolio content; 34px at the narrow responsive size.
- **Content body** (normal, inherited size, 1.75): readable DOM content in the text/panel view.
- **Interface label** (10-14px, mono): menus, controls, status text, and room labels.

## Layout

The studio layout groups the kitchen along the back-left wall in fridge, sink, preparation and cooking order. Dining sits next to that kitchen; the reading nook and lounge are backed by explicit wall volumes. The window workstation and covered balcony occupy the upper-right. Preserve the clear central aisle, chair-to-table alignment, separate lamp support and floor-to-cushion approach links when moving furniture. A source sprite being available does not justify an unsupported placement: the freestanding fireplace is omitted until a credible wall/flue position exists.

The shell removes the desktop-page container and fills the viewport: `.site-shell` is full-width with a minimum height of `100dvh`, `.room-stage` is fixed to the viewport, and `.room-viewport` fills it. The room art is a 640x360 world rendered with pixelated edges and contain/FIT sizing, so the complete room remains visible and mobile viewports letterbox rather than crop or stretch it.

The portfolio's persistent visual layer is the room only. The portfolio menu is a native `details` control at the upper-left, room settings are at the upper-right, and cat controls are at the lower-left; these controls appear on demand. The DOM content is hash-addressable at `#about`, `#projects`, `#research`, `#cv`, and `#contact`, with `#text` as the text-view entry point. The content panel is capped at 800px in the page flow and the dialog is a right-side 470px maximum panel; narrow screens use 10px corner offsets and an 8px dialog inset.

## Elevation & Depth

The full-viewport room is flat at the shell level: its final rule removes the viewport border and box shadow. Depth comes from the existing room art and from tonal panel overlays. An opened content dialog uses `-20px 0 90px #0005` to separate text from the room. Keep world foot-depth and the lamp's lighting glow independent; the glow is a lighting layer, not a replacement for world-space footing.

## Shapes

The form language is rectangular and pixel-aware: 1px structural strokes, clipped room edges, pixelated art rendering, and small radii only where controls need grouping. Controls use a 4px radius, icon menus 5px, the cat control panel 6px, and content panels/dialogs 8px. Hotspots use a 32px pointer target with a 5px circular light point and a rectangular label that appears on hover, focus, or `Show places`.

## Components

### Buttons
- **Shape:** Compact rectangular control with a 1px structural line and 4px radius.
- **Default:** `#302720` surface, `#f1e5d0` text, `9px 12px` padding, inherited interface font.
- **Hover / Focus:** Hover changes the border to the accent; focus uses a 2px `#ffcd8f` outline with 4px offset.
- **Selected / Disabled:** `aria-pressed="true"` uses the observed selected brown state; disabled controls use 0.4 opacity and do not present as actionable.

### Inputs / Fields
- **Style:** Native `select` controls share the button stroke, surface, text, 4px radius, and compact padding; the cat picker expands to the available panel width.
- **Focus:** Use the shared visible focus outline; do not replace native keyboard behavior.

### Navigation
- **Style:** Native `details`/`summary` icon menus, each with a 44px square summary, inline SVG icon, warm translucent surface, and 1px border.
- **Behavior:** The portfolio menu reveals hash links and the text-version link below the icon. Room settings and cat controls use the same on-demand pattern. Labels remain accessible through `aria-label` and normal DOM text.

### Cards / Containers
- **Content panel:** The portfolio content uses a warm translucent `#29221df7` surface, 8px radius, and 24px padding; it is a revealable text layer, not persistent chrome.
- **Dialog:** The native dialog uses the same panel surface, a warm border, right-side placement, scrollable content, and a sticky close control; on narrow screens it fills the viewport with an 8px inset.

### Room Viewport, Hotspots, and Lighting
The room viewport is the signature component. Existing pixel art is the visual source; hotspots are absolutely positioned from room coordinates and link to the corresponding DOM section or external GitHub destination. Their labels are available on hover, keyboard focus, or the explicit Show places control. The world footing/depth and lamp glow remain separate layers so lighting does not change interaction or character grounding.

## Do's and Don'ts

### Do:
- **Do** keep the entire 640x360 room visible with FIT/contain sizing and mobile letterboxing.
- **Do** keep the existing room art as the visual anchor; add no new art to the system.
- **Do** reveal menus, cat controls, hotspots, and text panels on demand with native controls and visible focus.
- **Do** keep portfolio content reachable as normal DOM through hashes, the text view, or the dialog.
- **Do** keep world foot-depth and lamp-light glow as separate concerns.

### Don't:
- **Don't** restore a persistent header, hero, footer, or text dashboard over the room.
- **Don't** crop, stretch, or hide the whole room on mobile.
- **Don't** require canvas, hover, drag, or game knowledge to read the portfolio.
- **Don't** merge the lamp's lighting glow into the world foot-depth rule.
- **Don't** introduce an unrelated palette, asset set, token scale, or narrative.
