# Cyberpunk-Style Interactive Portfolio

A 2D side-scrolling portfolio: walk, jump, dash and explore a deterministic neon city
where every data node in the undercity is a skill, every NPC is a professional
reference, and every monument is a project case study.

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
| SPACE / W / ↑ | Jump (press again mid-air to double jump; hold in coolant to swim) |
| SHIFT | Dash |
| Left click / drag | Break blocks |
| Right click | Place a crate |
| E | Interact (NPCs, holo-signs, monuments, data caches) |
| I | Skill inventory |
| ESC | Close any panel |

On touch devices an on-screen D-pad and action buttons appear automatically.

## The city

| District | Resume section |
|---|---|
| Residential Area (spawn) | About Me — apartment block + scrapyard of deprecated tech |
| Market Street | Frontend & UI/UX work — neon stalls, the bar, billboard ads |
| Industrial Zone | Backend & legacy systems — the foundry |
| Corporate District | Flagship project — the drone-patrolled Mega-Corp Tower |
| Exclusion Zone | Future goals — a data cache in the ruins at the grid's edge |
| The Undercity (below) | Skills — break glowing data nodes; hidden rooms reward digging |

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
  assets/craftpix/      CraftPix cyberpunk pixel art (see ATTRIBUTION.md)
  game/
    EventBus.ts         Sole communication broker between React and Phaser
    main.ts             Phaser config (Arcade physics, RESIZE scale, Light2D)
    scenes/
      BootScene.ts      Tileset compositing (CraftPix art + procedural overlays)
      GameScene.ts      Orchestrator: breaking, interaction, lighting, streaming
    world/
      PerlinNoise.ts    Seeded gradient noise + fBm octaves (no Math.random)
      WorldGenerator.ts Deterministic districts, undercity caves, data nodes
      structures.ts     Blueprint grids: apartment, tower, foundry, market, vault
      ChunkManager.ts   32x32 tilemap chunk streaming + per-chunk neon lights
      Tiles.ts          Tile registry, collision + palette tables
    entities/           Player controller, townspeople NPCs, patrol drones
    parallax/           Wrapped-image skyline parallax (no TileSprite)
```

Key invariants (see the PRD and `DESIGN.md`):

- **Deterministic city.** Terrain uses seeded Perlin fBm; the same seed ships every
  build, so portfolio content can never generate out of reach.
- **Blocks are data.** Breaking mutates the world matrix and redraws a tile — no
  physics sprites per block, ever.
- **EventBus only.** React never reaches into Phaser objects and vice versa.
- **Content is decoupled.** Updating the resume means editing `src/data/portfolio.json`
  and pushing; CI redeploys the city.

## Customizing

1. Edit `src/data/portfolio.json` — name, links, skills (with data-node types + spawn
   depths), experience (NPC dialogue), holo-signs, projects and future goals.
2. Optional: drop a cinematic intro video at `public/intro.mp4` (e.g. generated with
   Higgsfield from a city reference image) — the loading screen plays it automatically.
3. Push to `main` — the GitHub Actions workflow builds and deploys to GitHub Pages
   (enable **Settings → Pages → Source: GitHub Actions** once).
