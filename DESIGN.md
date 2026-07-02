---
version: alpha
name: Terraria Portfolio Classic
colors:
  primary: "#1b1c1e"        # dark iron plate — panel bodies
  secondary: "#3d2d1e"      # carved wood — borders, sign bodies
  accent-gold: "#d4af37"    # forged gold — headers, focus, flagship elements
  neutral-light: "#f4ede2"  # parchment — light panels and primary text on iron
  parchment-ink: "#2a2118"  # ink on parchment surfaces
  muted: "#a89a85"          # warm grey — secondary text on iron
  danger: "#c0392b"
  success: "#5f9e4a"
  info: "#4f8fba"
typography:
  retro-arcade:
    fontFamily: "Press Start 2P"   # numbers, interactive headers, HUD labels
  body-text:
    fontFamily: "VT323"            # dialogue logs, paragraphs, tooltips
rounded:
  none: 0px
  pixel: 4px
spacing:
  sm: 8px
  md: 16px
motion:
  duration-fast: 0.18s
  duration-base: 0.35s
  duration-cinematic: 0.8s
  ease-ui: "power2.out"
  ease-cinematic: "power3.inOut"
---

# Overview

Classic 16-bit RPG styling meets high-performance system execution. Every UI element
must resemble a physical component found in fantasy games: parchment scrolls, dark
iron plates, carved wooden signs. The game world is the star; the UI is its
blacksmith-forged frame.

# Graphic System Rules

- **Anti-patterns:** no modern flat layouts, no standard rounded cards, no default
  Tailwind sans-serif fonts, no pure black (#000), no generic rounded corners above
  4px, no bounce easing, no blur-based shadows, no glassmorphism.
- **Borders:** double-lined solid borders mimicking carved wood or iron panels
  (`border: 4px double var(--border-wood)`). Gold double borders are reserved for
  the highest-value elements (flagship projects, calls to action).
- **Surfaces:** three physical materials only —
  *iron plate* (`primary` body, wood double border) for HUD and system panels;
  *parchment* (`neutral-light` body, ink text) for dialogue and reading-length text;
  *carved wood* (`secondary` body, light text) for signs and small tooltips.
- **Typography roles:** all numbers and main interactive headers use
  "Press Start 2P". Long dialogue logs use "VT323" at 20px or larger.
- **Depth:** hard offset shadows only (`0 4px 0 rgba(0,0,0,0.45)`), echoing 16-bit
  sprite drop shadows.
- **Motion:** panels rise 12–24px and fade in over `duration-base` with `ease-ui`.
  Full-screen transitions use `duration-cinematic`. Motion communicates hierarchy,
  never personality for its own sake.

# World Rendering Rules

- Underground air must always show a darkened background wall (dirt, stone, or the
  owning structure's material) — never the sky parallax.
- Parallax uses wrapped image layers with per-layer `scrollFactor` (0.05 sky →
  0.35 near hills), coordinates wrapped via `Phaser.Math.Wrap` each frame. No
  full-screen TileSprites.
- Torches and crystals are Light2D point lights; ambient dims with depth toward
  `0x282a3a`, never full black.
