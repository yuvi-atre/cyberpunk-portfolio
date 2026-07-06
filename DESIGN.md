---
version: beta
name: Cyber Intrusion Terminal
colors:
  surface-deep: "#0d0f1e"     # deep indigo — page + canvas backing (never pure black)
  surface-panel: "#131629"    # system panel bodies
  surface-raised: "#1a1e38"   # raised cells, buttons, list items
  border-panel: "#2c3554"     # resting borders
  neon-blue: "#00f0ff"        # primary neon — terminal borders, links, focus
  neon-pink: "#ff2d95"        # accent neon — headers, calls to action, holo tags
  amber: "#ffb020"            # reserved: loot/cache moments only
  text-primary: "#d8e0ff"
  text-secondary: "#7a86b8"
  danger: "#ff4b4b"
  success: "#3dff8c"
  info: "#6bd7ff"
typography:
  retro-arcade:
    fontFamily: "Press Start 2P"   # numbers, interactive headers, HUD labels
  body-text:
    fontFamily: "VT323"            # dialogue readouts, paragraphs, tooltips
rounded:
  none: 0px                        # no rounded corners, ever
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

Retro-futuristic cyberpunk terminal styling over a high-performance WebGL city.
Every UI element must resemble hardware found in a neon-soaked megacity: CRT
terminal readouts, holographic tags, riveted system panels. The game world is
the star; the UI is its street-side signage.

# Graphic System Rules

- **Anti-patterns:** no modern flat layouts, no standard rounded cards, no
  default Tailwind sans-serif fonts, no pure black (#000), no rounded corners
  at all, no bounce easing, no blur-heavy glassmorphism, no generic "AI slop"
  gradients.
- **Borders:** hard 2px solid borders. Neon blue borders with a tight 6px glow
  are reserved for terminal screens (reading surfaces); neon pink for holo
  tags, headers, and the highest-value calls to action (JACK IN, Recruiter
  Mode); amber only for loot moments (data cache). Resting chrome uses
  `border-panel`.
- **Surfaces:** three materials only —
  *system panel* (`surface-panel` body, faint inner cyan trace) for HUD and
  chrome; *terminal screen* (dark gradient body, cyan border, scanline overlay)
  for dialogue and reading-length text; *holo tag* (translucent panel, magenta
  glow) for signs and short notices.
- **Typography roles:** all numbers and main interactive headers use
  "Press Start 2P". Long dialogue readouts use "VT323" at 20px or larger.
- **Depth:** hard offset shadows (`0 4px 0 rgba(0,0,0,0.5)`) plus tight neon
  glows (max 6px blur) — glow is a light source, not decoration.
- **Motion:** panels rise 12–24px and fade in over `duration-base` with
  `ease-ui`. Full-screen transitions use `duration-cinematic`. Motion
  communicates hierarchy, never personality for its own sake.

# World Rendering Rules

- Underground air must always show a darkened background wall (soil, metal, or
  the owning structure's material) — never the sky parallax.
- Parallax uses wrapped image layers with per-layer `scrollFactor` (0.06 far
  skyline → 0.42 near rooftops), coordinates wrapped via `Phaser.Math.Wrap`
  each frame. No full-screen TileSprites. Skyline silhouettes are tinted
  progressively darker violet toward the camera.
- Neon lamps, holo signs and power cells are Light2D point lights; ambient is
  perpetual night (`0xaab2d8` at street level) dimming with depth toward
  `0x26283a`, never full black.
- The city is deterministic: constant world seed, identical layout for every
  visitor.
