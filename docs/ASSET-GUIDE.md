# Asset Pipeline Guide

Adapted from the user-provided "Terraria Asset Extraction and Sprite Formatting
Guide", annotated with what this project adopts and why. Companion to
`DESIGN.md` (visual tokens) and `src/assets/kenney/ATTRIBUTION.md` (licenses).

## Adopted rules

1. **Crisp pixel rendering.** The Phaser config sets `pixelArt: true` and
   `roundPixels: true` (`src/game/main.ts`), disabling WebGL anti-aliasing so
   18x18 tiles stay sharp at any zoom.
2. **Anti-bleed tile padding.** The composited tileset strip uses a 1px margin
   and 2px spacing between cells with edge-pixel extrusion
   (`BootScene.makeTileset`), and `ChunkManager` loads it with matching
   `margin`/`spacing` parameters. This is the engine-agnostic version of
   Terraria's "2-pixel padding" convention: without it, WebGL texture sampling
   bleeds neighboring tiles into each other at chunk seams.
3. **Frame-size discipline.** Any future spritesheet load must specify
   `frameWidth`/`frameHeight`/`margin`/`spacing` explicitly — never rely on
   default flush-grid math.
4. **Background wall layer.** Underground air renders a darkened wall texture
   behind the terrain layer (see `LESSONS.md`), which is the single biggest
   contributor to the Terraria depth aesthetic.

## Asset sourcing policy

- **Never ship extracted or rehosted Terraria assets** (TConvert/XNB output,
  `GreatGameDota/Terraria-Tile-Images`, HD upscale packs). Extraction from an
  owned copy is tolerated for private modding of Terraria itself; redistribution
  in a standalone public site is not licensed and reads as IP theft on a
  portfolio.
- **Current source:** Kenney Pixel Platformer packs (CC0) composited with
  procedural overlays at boot. CC0 requires nothing and permits everything.
- **Character sprites:** GrafxKid's "Classic Hero" (CC0, OpenGameArt) — idle,
  run and jump frames; NPC variants are palette-swapped at boot
  (`src/assets/grafxkid/`).
- **Fan-tribute framing:** the in-game About panel carries a respectful
  disclaimer crediting Re-Logic for the aesthetic inspiration. Mimicking a
  *style* is fine; shipping their *files* is not — the disclaimer does not
  substitute for a license.
- **Curated index:** UkoeHB's gamedev free-assets gist
  (https://gist.github.com/UkoeHB/9991c1a60e887e448800ed2f740a037a) — a good
  starting point for CC0 fonts, tilesets, audio and palettes.
- **Verified open Terraria-likes:** `CPhlebas/ore-chasm` is a real GPLv2+
  open-source project with free-licensed assets (its tiles/mascot don't fit
  this project's needs, but it is a legitimate source, unlike ripped-asset
  repos).
- **Vetted upgrade paths** if more variety is wanted later:
  - OpenGameArt CC0 tilesets (GrafxKid's Cave Tileset and similar).
  - `VerdantMod` cave flora (GPLv3 — only if the project accepts GPL asset
    obligations and ships the license).
  - Any itch.io pack whose own page grants commercial redistribution — download
    from the author's page, never from aggregator repos, and record the license
    in `ATTRIBUTION.md`.
- Every added asset gets an entry in `src/assets/*/ATTRIBUTION.md` with source
  URL and license before it is committed.
