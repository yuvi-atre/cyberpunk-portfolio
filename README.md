# Terraria-Style Interactive Portfolio

A 2D sandbox portfolio: walk, jump, mine and explore a deterministic pixel world where
every ore is a skill, every NPC is a professional reference, and every monument is a
project case study.

**Stack:** Phaser 3 · React 18 · TypeScript · Vite · Tailwind CSS 4 · GSAP

## Run it

```bash
npm install
npm run dev      # dev server with HMR
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build
```

## Controls

| Input | Action |
|---|---|
| A/D or ←/→ | Move |
| SPACE / W / ↑ | Jump (hold in water to swim) |
| Left click / drag | Mine blocks |
| Right click | Place a dirt block |
| E | Interact (NPCs, signs, monuments, chests) |
| I | Skill inventory |
| ESC | Close any panel |

On touch devices an on-screen D-pad and action buttons appear automatically.

## Architecture

```
src/
  main.tsx              React bootstrap (mounts App)
  App.tsx               UI shell: owns modal state + z-index stack
  PhaserGame.tsx        React<->Phaser bridge (mount/unmount lifecycle)
  components/           DOM overlay: HUD, modals, toasts, touch controls
  services/
    PortfolioService.ts Typed accessor over portfolio.json
  data/
    portfolio.json      ALL resume content lives here — edit this file only
  game/
    EventBus.ts         Sole communication broker between React and Phaser
    main.ts             Phaser config (Arcade physics, RESIZE scale, Light2D)
    scenes/
      BootScene.ts      Procedural texture generation (tileset, sprites, parallax)
      GameScene.ts      Orchestrator: mining, interaction, lighting, streaming
    world/
      PerlinNoise.ts    Seeded gradient noise + fBm octaves (no Math.random)
      WorldGenerator.ts Deterministic terrain, biomes, caves, ores, embedding
      structures.ts     Blueprint grids: house, castle, pyramid, dungeons
      ChunkManager.ts   32x32 tilemap chunk streaming + per-chunk lights
      Tiles.ts          Tile registry, collision + palette tables
    entities/           Player controller, wandering NPCs
    parallax/           Wrapped-image parallax (no TileSprite)
```

Key invariants (see the PRD and `DESIGN.md`):

- **Deterministic world.** Terrain uses seeded Perlin fBm; the same seed ships every
  build, so portfolio content can never generate out of reach.
- **Blocks are data.** Mining mutates the world matrix and redraws a tile — no physics
  sprites per block, ever.
- **EventBus only.** React never reaches into Phaser objects and vice versa.
- **Content is decoupled.** Updating the resume means editing `src/data/portfolio.json`
  and pushing; CI redeploys the world.

## Customizing

1. Edit `src/data/portfolio.json` — name, links, skills (with ore types + spawn depths),
   experience (NPC dialogue), signs, projects and future goals.
2. Optional: drop a cinematic intro video at `public/intro.mp4` (e.g. generated with
   Higgsfield from the reference image) — the loading screen plays it automatically.
3. Push to `main` — the GitHub Actions workflow builds and deploys to GitHub Pages
   (enable **Settings → Pages → Source: GitHub Actions** once).
