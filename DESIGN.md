# DESIGN.md — Terraria-Style Interactive Portfolio Design System

This file is the single source of truth for visual design. All React components and
Phaser-generated textures must consume these tokens as **semantic roles**, not raw values.

## Design Tokens (machine-readable)

```yaml
typography:
  display: "'Press Start 2P', monospace"   # headings, HUD labels, buttons
  body: "'VT323', monospace"               # dialogue, paragraphs, tooltips
  scale:
    display-lg: 20px
    display-md: 14px
    display-sm: 10px
    body-lg: 24px
    body-md: 20px
    body-sm: 16px

color:
  # Semantic UI roles
  surface-panel: "#1a1626"        # modal / panel background (deep dusk purple)
  surface-panel-raised: "#262038" # inner cards, hovered rows
  border-panel: "#4a3f66"         # panel borders (2px, never rounded > 4px)
  border-accent: "#c8a84b"        # gold trim for focused / flagship elements
  text-primary: "#f2ead8"         # parchment white
  text-secondary: "#a99fc0"       # muted lavender-grey
  text-accent: "#ffd76a"          # gold highlight (item names, links)
  danger: "#e0524d"               # hearts, destructive actions
  success: "#6fce62"              # confirmations, growth
  info: "#5cb8e8"                 # water/crystal accent, hyperlinks

  # World palette (Phaser texture generation)
  sky-day: "#87b5e5"
  grass: "#5daa3e"
  dirt: "#6e4a2f"
  stone: "#7a7a85"
  stone-brick: "#565660"
  red-brick: "#7d3b30"
  sand: "#e4cf7a"
  sandstone: "#c9a95c"
  wood: "#8a5c33"
  water: "#2662d9"
  ore-gold: "#ffcf40"
  ore-silver: "#d8dce8"
  crystal-blue: "#54c8f0"
  moss: "#4ec455"
  torch-flame: "#ffb02e"

space:
  unit: 4px          # all spacing is a multiple of 4
  panel-padding: 16px
  modal-gap: 12px

radius:
  panel: 4px         # pixel-art aesthetic: hard corners, max 4px
  button: 2px

motion:
  duration-fast: 0.18s
  duration-base: 0.35s
  duration-cinematic: 0.8s
  ease-ui: "power2.out"          # GSAP ease for panels and buttons
  ease-cinematic: "power3.inOut" # GSAP ease for full-screen transitions

elevation:
  panel-shadow: "0 4px 0 rgba(0,0,0,0.45)"   # hard offset shadow, no blur (pixel-art)
```

## Rationale (human-readable)

- **Pixel fidelity first.** No blur-based shadows, no border radii above 4px, no gradients
  in UI chrome. Depth is communicated with hard offset shadows and 2px borders, echoing
  16-bit game interfaces.
- **Two-font system.** `Press Start 2P` is loud and used sparingly (headings, buttons,
  HUD). `VT323` carries all reading-length text — it is a pixel font that stays legible
  at paragraph sizes.
- **Color is strategic, not decorative.** Gold (`text-accent`, `border-accent`) is
  reserved for the highest-value elements: flagship projects, legendary skills, calls to
  action. Info-blue marks hyperlinks and water-themed lore. Everything else stays in the
  muted dusk-purple neutrals so the game world underneath remains the star.
- **Motion is purposeful.** Panels rise 12px and fade in over `duration-base` with
  `ease-ui`. Full-screen transitions (loading → game) take `duration-cinematic`. Nothing
  bounces or wobbles; motion communicates hierarchy, never personality for its own sake.
- **Anti-patterns (negative constraints).** Never: glassmorphism, neumorphism, rounded
  pill buttons, drop shadows with blur, default Tailwind blue, gratuitous gradients,
  system font stacks in UI chrome, or animation durations over 1s for interactive
  elements.
