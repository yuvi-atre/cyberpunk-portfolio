# Asset Pipeline Guide

Companion to `DESIGN.md` (visual tokens) and `src/assets/craftpix/ATTRIBUTION.md`
(licenses).

## Adopted rules

1. **Crisp pixel rendering.** The Phaser config sets `pixelArt: true` and
   `roundPixels: true` (`src/game/main.ts`), disabling WebGL anti-aliasing so
   32x32 tiles stay sharp at any zoom.
2. **Anti-bleed tile padding.** The composited tileset strip uses a 1px margin
   and 2px spacing between cells with edge-pixel extrusion
   (`BootScene.makeTileset`), and `ChunkManager` loads it with matching
   `margin`/`spacing` parameters. Without it, WebGL texture sampling bleeds
   neighboring tiles into each other at chunk seams.
3. **Frame-size discipline.** Every spritesheet load specifies
   `frameWidth`/`frameHeight` explicitly (48x48 for all CraftPix characters) —
   never rely on default flush-grid math.
4. **Background wall layer.** Underground air renders a darkened wall texture
   behind the terrain layer (see `LESSONS.md`) so tunnels read as depth, never
   as sky.

## Asset sourcing policy

- **Current source:** free CraftPix cyberpunk packs, staged under
  `src/assets/craftpix/` with clean names. The CraftPix free license permits use
  in games (commercial included); redistribution of raw assets as assets is not
  permitted — which is fine, they ship compiled into the game bundle.
- Player: "Free 3 Cyberpunk Characters" Punk + "Free Extra Animations" (48px
  frames — taller than the 32px tile grid; the physics body is 14x30 anchored
  to the sprite's feet).
- Tiles the packs don't cover (holo signs, coolant, data-node glows, street
  lamps) are drawn procedurally in `BootScene` on top of pack art.
- Skyline parallax uses the "Scrolling City Backgrounds" night silhouettes with
  `setTintFill` — the art is greyscale; tint-fill flattens each layer into a
  solid violet depth plane against the procedural smog-gradient sky.
- **Never ship ripped commercial sprites** (e.g. Terraria extractions or AI
  upscales of them) — recruiters read it as IP theft. Use licensed packs (this
  repo), CC0 (Kenney, OpenGameArt), or procedural drawing.
- Every added asset gets an entry in `src/assets/craftpix/ATTRIBUTION.md` with
  its source pack before it is committed.
