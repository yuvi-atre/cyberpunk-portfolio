# LESSONS.md — Working Memory

One lesson per section, one-line summary first. Update existing notes rather than
creating duplicates.

## Lesson: Strict EventBus-Based State Bridging

Summary: Never mutate Phaser objects directly from the React virtual DOM.

Context: When rendering dynamic HTML UI elements on top of the Phaser game canvas,
state transitions must cross the boundary safely.

Solution:
1. Phaser scenes emit abstract data payloads strictly through `EventBus.emit()`
   (see `src/game/EventBus.ts`).
2. React components bind listener functions with `EventBus.on()` inside `useEffect`
   and remove them in the cleanup return.

## Lesson: Background Walls Make Caves Read as Caves

Summary: Underground air cells must render a darkened wall layer behind the terrain,
or mined tunnels show the sky parallax and the world looks flat.

Context: Terraria's depth illusion comes from a wall layer behind every underground
cell, plus edge shading. Without it, block-breaking punches holes to the sky.

Solution: `WorldGenerator` emits a parallel `walls` matrix (dirt/stone by depth,
structure-specific walls behind buildings); `ChunkManager` renders it as a second
non-colliding tilemap layer one depth level below the terrain layer, with the same
Light2D pipeline.

## Lesson: Don't Poll `activePointer.isDown` for Held Input

Summary: Track pointer-held state from canvas-originated `pointerdown`/`pointerup`
events; polling `isDown` can read phantom state and auto-mine the world.

## Lesson: Licensed Art Only

Summary: Ripped commercial sprites (Terraria extractions, AI upscales of them) must
never ship in this repo — recruiters see it as IP theft. Use CC0 packs (Kenney,
OpenGameArt) or procedural drawing; compositing happens in `BootScene.makeTileset`.
