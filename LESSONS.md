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

## Lesson: Background Walls Make Tunnels Read as Tunnels

Summary: Underground air cells must render a darkened wall layer behind the terrain,
or dug shafts show the sky parallax and the world looks flat.

Context: The undercity depth illusion comes from a wall layer behind every
underground cell, plus structure-specific walls behind buildings.

Solution: `WorldGenerator` emits a parallel `walls` matrix (soil/metal by district,
factory back-tiles behind buildings); `ChunkManager` renders it as a second
non-colliding tilemap layer one depth level below the terrain layer, with the same
Light2D pipeline.

## Lesson: Freeze Distant NPC Physics Until Their Chunks Stream In

Summary: NPCs spawned outside the camera's chunk radius have no collision tiles
under them and fall through the world before the player ever arrives.

Context: Chunked tilemap streaming only creates colliders for chunks near the
camera; entity spawn happens once at scene start for the whole city.

Solution: NPC bodies spawn with `body.enable = false`; `GameScene.update` calls
`npc.activate()` the first time the camera's `worldView` contains the NPC, at which
point its terrain chunks are guaranteed to exist (streaming covers view + 1 chunk).

## Lesson: Tint-Fill Greyscale Silhouette Layers, Never Multiply-Tint

Summary: The CraftPix scrolling-city night layers are greyscale silhouettes;
multiplicative `setTint` can only darken them toward black, so use `setTintFill`
to flatten each layer into a solid depth-plane color against the sky gradient.

Also: anchor silhouette bases at a fixed horizon fraction of the screen (terrain
covers the overlap), not at the screen bottom — the far layer's buildings are
frame-tall and will otherwise cover the entire sky.

## Lesson: Don't Poll `activePointer.isDown` for Held Input

Summary: Track pointer-held state from canvas-originated `pointerdown`/`pointerup`
events; polling `isDown` can read phantom state and auto-break the world.

## Lesson: Licensed Art Only

Summary: Ripped commercial sprites (Terraria extractions, AI upscales of them) must
never ship in this repo — recruiters see it as IP theft. Current art is free
CraftPix cyberpunk packs (license permits game use) plus procedural drawing;
compositing happens in `BootScene.makeTileset`. Some CraftPix "lamp" tiles are
animation strips that render as striped boxes when used as static tiles — lamps
are drawn procedurally instead.
