import Phaser from 'phaser';
import { SOLID_TILES, TILE_SIZE, Tile } from './Tiles';
import type { GeneratedWorld } from './WorldGenerator';

export const CHUNK_SIZE = 32; // tiles per chunk side

interface Chunk {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
  colliders: Phaser.Physics.Arcade.Collider[];
  lights: Phaser.GameObjects.Light[];
}

/**
 * Streams the world matrix into Phaser as discrete 32x32 tilemap chunks.
 * Only chunks intersecting the camera view (plus a one-chunk buffer) are
 * alive; everything else is destroyed to keep memory and draw calls flat.
 */
export class ChunkManager {
  private chunks = new Map<string, Chunk>();
  private useLights: boolean;
  private chunksX: number;
  private chunksY: number;

  constructor(
    private scene: Phaser.Scene,
    private world: GeneratedWorld,
    private collideTargets: Phaser.Types.Physics.Arcade.ArcadeColliderType[]
  ) {
    this.useLights = scene.game.renderer.type === Phaser.WEBGL;
    this.chunksX = Math.ceil(world.width / CHUNK_SIZE);
    this.chunksY = Math.ceil(world.height / CHUNK_SIZE);
  }

  /** Ensure chunks covering the camera (+buffer) exist; cull distant ones. */
  update(camera: Phaser.Cameras.Scene2D.Camera): void {
    const view = camera.worldView;
    const px = CHUNK_SIZE * TILE_SIZE;
    const minCx = Math.max(0, Math.floor(view.x / px) - 1);
    const maxCx = Math.min(this.chunksX - 1, Math.floor(view.right / px) + 1);
    const minCy = Math.max(0, Math.floor(view.y / px) - 1);
    const maxCy = Math.min(this.chunksY - 1, Math.floor(view.bottom / px) + 1);

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const key = `${cx},${cy}`;
        if (!this.chunks.has(key)) this.createChunk(cx, cy);
      }
    }
    for (const [key, chunk] of this.chunks) {
      const [cx, cy] = key.split(',').map(Number);
      if (cx < minCx - 1 || cx > maxCx + 1 || cy < minCy - 1 || cy > maxCy + 1) {
        this.destroyChunk(key, chunk);
      }
    }
  }

  private createChunk(cx: number, cy: number): void {
    const { world } = this;
    const rows: number[][] = [];
    for (let y = 0; y < CHUNK_SIZE; y++) {
      const wy = cy * CHUNK_SIZE + y;
      const row: number[] = new Array(CHUNK_SIZE);
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const wx = cx * CHUNK_SIZE + x;
        row[x] =
          wx < world.width && wy < world.height ? world.data[wy * world.width + wx] : Tile.AIR;
      }
      rows.push(row);
    }

    const map = this.scene.make.tilemap({
      data: rows,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      insertNull: true,
    });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0)!;
    const layer = map.createLayer(0, tileset, cx * CHUNK_SIZE * TILE_SIZE, cy * CHUNK_SIZE * TILE_SIZE)!;
    layer.setCollision(SOLID_TILES);
    layer.setDepth(10);
    if (this.useLights) layer.setPipeline('Light2D');

    const colliders = this.collideTargets.map((target) =>
      this.scene.physics.add.collider(target, layer)
    );

    // spawn point lights for every torch tile in this chunk
    const lights: Phaser.GameObjects.Light[] = [];
    if (this.useLights) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          if (rows[y][x] === Tile.TORCH) {
            lights.push(
              this.scene.lights.addLight(
                (cx * CHUNK_SIZE + x) * TILE_SIZE + 8,
                (cy * CHUNK_SIZE + y) * TILE_SIZE + 6,
                140,
                0xffb02e,
                1.6
              )
            );
          }
          if (rows[y][x] === Tile.CRYSTAL_BLUE) {
            lights.push(
              this.scene.lights.addLight(
                (cx * CHUNK_SIZE + x) * TILE_SIZE + 8,
                (cy * CHUNK_SIZE + y) * TILE_SIZE + 8,
                90,
                0x54c8f0,
                1.0
              )
            );
          }
        }
      }
    }

    this.chunks.set(`${cx},${cy}`, { map, layer, colliders, lights });
  }

  private destroyChunk(key: string, chunk: Chunk): void {
    chunk.colliders.forEach((c) => c.destroy());
    chunk.lights.forEach((l) => this.scene.lights.removeLight(l));
    chunk.map.destroy(); // destroys the layer too
    this.chunks.delete(key);
  }

  getTile(tx: number, ty: number): number {
    const { world } = this;
    if (tx < 0 || tx >= world.width || ty < 0 || ty >= world.height) return Tile.BEDROCK;
    return world.data[ty * world.width + tx];
  }

  /**
   * Blocks are data, not entities: mutate the world matrix and let the
   * owning chunk layer redraw the cell. Never spawn physics sprites here.
   */
  setTile(tx: number, ty: number, tile: number): void {
    const { world } = this;
    if (tx < 0 || tx >= world.width || ty < 0 || ty >= world.height) return;
    world.data[ty * world.width + tx] = tile;

    const chunk = this.chunks.get(`${Math.floor(tx / CHUNK_SIZE)},${Math.floor(ty / CHUNK_SIZE)}`);
    if (!chunk) return;
    const lx = tx % CHUNK_SIZE;
    const ly = ty % CHUNK_SIZE;
    if (tile === Tile.AIR) {
      chunk.layer.removeTileAt(lx, ly, true, true);
    } else {
      const t = chunk.layer.putTileAt(tile, lx, ly, true);
      t.setCollision(SOLID_TILES.includes(tile));
    }
  }

  removeTileAtWorldXY(wx: number, wy: number): void {
    this.setTile(Math.floor(wx / TILE_SIZE), Math.floor(wy / TILE_SIZE), Tile.AIR);
  }

  destroy(): void {
    for (const [key, chunk] of this.chunks) this.destroyChunk(key, chunk);
  }
}
