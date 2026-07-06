# claude-memory.md — Architecture & Decisions Log

Living document. Update whenever major context is given or a structural
decision is made about this codebase.

## What this project is

A 2D cyberpunk interactive portfolio (React 18 + Phaser 3 + TypeScript +
Vite + Tailwind v4 + GSAP) built to impress recruiters for a senior
engineering role. Goal: polished, performant, and impossible to get lost in.

## Big structural decisions (2026-07-06 overhaul)

1. **No procedural generation.** The old 512x200 Perlin world
   (WorldGenerator/PerlinNoise/structures) was deleted. The world is now
   `src/game/world/CityMap.ts`: a hand-authored 176x44 tile city, one
   material family per district, dead-flat streets. Every marker (NPC,
   sign, shard, project, elevator) is placed explicitly.
2. **No block breaking or placing.** All mining/ore/coolant concepts are
   gone from `Tiles.ts` (36 tiles now, renumbered). Navigation is
   walk-through archways (DOOR tiles are non-solid decoration) plus one
   elevator in the tower — an interactable that fades the camera and
   teleports between paired `elevator` markers with the same id.
3. **Skills are shot, not mined.** 10 floating "data shards" (procedural
   diamond texture, tinted by skill index against `SHARD_COLORS`) sit along
   the route. Bullets or player touch collect them → `SKILL_COLLECTED` →
   toast + inventory. Shard ids == skill ids in `portfolio.json`.
4. **Player gun rig** (CraftPix "Guns for Cyberpunk Characters", Biker):
   - Body sheets are ARMLESS (`gun-idle/run/jump.png`, 48x48).
   - The arm+pistol is composited at boot (`makeArmGun`): hand sprite №3 +
     gun №5_1 drawn at (25,11) on a 48x32 canvas. Shoulder pivot at pixel
     (14,16); Player sets origin to match, positions it at body offset
     (±7,0), aims at the pointer, `flipY` when aiming left.
   - Muzzle offset from pivot: (23, ∓2.5). Bullets: pooled group (16),
     gravity-free, retired on `body.blocked` or 900ms. Muzzle flash is a
     2-frame procedural sheet + a 70ms point light.
   - Dash & double-jump sheets come from the old melee pack (they have
     arms) — the arm overlay hides during those anims.
5. **NPC patrol** is a bounded ping-pong walk (±2 tiles named, ±4 walkers)
   with idle pauses; turns on patrol edge OR `body.blocked` — map author
   guarantees flat ground across each patrol span, so no stuck NPCs.
6. **Recruiter Mode** (`src/components/RecruiterMode.tsx`): HUD toggle (or
   `R` key) → emits `UI_RECRUITER_STATE` → GameScene `scene.pause()` →
   full-screen z-30 overlay with project card grid, contact links, skill
   matrix, future goals. Escape or "RESUME GAME" resumes.
7. **Native-DPI rendering** (2026-07-06, after "blocks look upscaled"
   feedback): Phaser's `Scale.RESIZE` sizes the canvas in CSS pixels, which
   high-DPI displays upscale — combined with the old 1.5 camera zoom, texels
   were blown up ~3x. Now `game/main.ts` uses `Scale.NONE` with the backing
   store in DEVICE pixels (`clientSize * RENDER_DPR`, CSS size restored via
   `scale.zoom = 1/DPR`), `PhaserGame.tsx` forwards resizes through a
   ResizeObserver, and the camera zoom is the integer `GAME_ZOOM =
   round(DPR)` so one texel = whole device pixels. Net: tiles read at ~32
   CSS px (CraftPix promo density), pixel-crisp. Don't reintroduce
   fractional camera zooms; ParallaxBackground sizes its image pool from
   `scene.scale.width`, not a hardcoded viewport.
8. **Neon pink/blue theme** in `src/styles/index.css`: `--neon-pink
   #ff2d95`, `--neon-blue #00f0ff`, deep indigo surfaces (never pure
   black), zero border radius, Press Start 2P + VT323. Amber is reserved
   for loot moments only. Welcome screen = synthwave grid floor
   (`.grid-floor`), horizon glow, chromatic glitch title.

## Layout of the city (tile coords, surface row y=32)

spawn x6 → welcome sign x9 → apartment x14-30 (mentor NPC, this-portfolio
monument, java shard on mezzanine) → street shards react x34 / ts x39 →
market x43-70 (two stalls, vendor NPC, phaser+node shards above awnings) →
foundry x80-108 (archivist NPC, legacy-migration monument, python/sql
shards over catwalks, docker x105) → plaza x111-115 → tower x118-138
(director NPC in lobby, elevator x128 lobby↔deck y8, flagship monument +
aws shard on deck) → exclusion edge x146+ (edge sign, ruin, future-goals
cache chest x160, csharp shard). Camera bounds clamp at (SURFACE_Y+7) rows
so the frame never fills with underground.

## Invariants that must not break

- All portfolio content lives in `src/data/portfolio.json` only
  (`PortfolioService` is the typed accessor). No text hardcoded elsewhere.
- React ↔ Phaser only via `EventBus` (`src/game/EventBus.ts`).
- Tileset strip is composited in BootScene with 1px extruded margins;
  ChunkManager's `addTilesetImage(..., 1, 2)` must match.
- Chunk streaming stays: NPCs activate only when the camera view contains
  them (else they'd fall through unstreamed terrain).
- Elevator marker pairs share the same id; `rideElevator` teleports to the
  farther stop.
- Shard tint index = index in `portfolio.json` skills array (inventory
  swatches mirror it with the same 4-color cycle).

## Asset provenance

Everything under `src/assets/craftpix/` — see `ATTRIBUTION.md` there. New
gun rig files came from `NEW ASSETS PLEASE USE/craftpix-net-730561-...`
(bodies Idle2/Run2/Jump2 = two-hand grip variants, hand №3 horizontal, gun
№5 blue pistol, bullets №5). The source pack keeps hands/guns/effects
separate; we composite at boot rather than shipping edited art.

## Pending user customizations

- Real name/handles in `portfolio.json` (currently "Your Name" /
  "yourhandle").
- Real project links + live URLs (Recruiter Mode shows LIVE SITE button
  only when `live` is non-empty).
- Optional `public/intro.mp4` plays behind the welcome screen when present.
