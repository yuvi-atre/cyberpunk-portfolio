import Phaser from 'phaser';
import { SOLID_TILES, TILE_SIZE, Tile } from './Tiles';
import type { GeneratedWorld } from './WorldGenerator';

export const CHUNK_SIZE = 32; // tiles per chunk side

interface Chunk {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
  wallMap: Phaser.Tilemaps.Tilemap;
  wallLayer: Phaser.Tilemaps.TilemapLayer;
  colliders: Phaser.Physics.Arcade.Collider[];
  lights: Phaser.GameObjects.Light[];
}

/**
 * Streams the world matrix into Phaser as discrete 32x32 tilemap chunks:
 * a background wall layer (non-colliding, darkened) under a terrain layer.
 * Only chunks intersecting the camera view (plus a one-chunk buffer) are
 * alive; everything else is destroyed to keep memory and draw calls flat.
 *
 * The tileset strip is extruded (1px margin, 2px spacing) to prevent WebGL
 * texture bleeding at tile seams — see docs/ASSET-GUIDE.md.
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

  private sliceRows(source: Int16Array, cx: number, cy: number): number[][] {
    const { world } = this;
    const rows: number[][] = [];
    for (let y = 0; y < CHUNK_SIZE; y++) {
      const wy = cy * CHUNK_SIZE + y;
      const row: number[] = new Array(CHUNK_SIZE);
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const wx = cx * CHUNK_SIZE + x;
        row[x] =
          wx < world.width && wy < world.height ? source[wy * world.width + wx] : Tile.AIR;
      }
      rows.push(row);
    }
    return rows;
  }

  private makeLayer(
    rows: number[][],
    cx: number,
    cy: number,
    depth: number
  ): { map: Phaser.Tilemaps.Tilemap; layer: Phaser.Tilemaps.TilemapLayer } {
    const map = this.scene.make.tilemap({
      data: rows,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      insertNull: true,
    });
    // margin 1 / spacing 2 matches the extruded strip built in BootScene
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE, 1, 2)!;
    const layer = map.createLayer(
      0,
      tileset,
      cx * CHUNK_SIZE * TILE_SIZE,
      cy * CHUNK_SIZE * TILE_SIZE
    )!;
    layer.setDepth(depth);
    if (this.useLights) layer.setPipeline('Light2D');
    return { map, layer };
  }

  private createChunk(cx: number, cy: number): void {
    const rows = this.sliceRows(this.world.data, cx, cy);
    const wallRows = this.sliceRows(this.world.walls, cx, cy);

    const wall = this.makeLayer(wallRows, cx, cy, 9);
    const terrain = this.makeLayer(rows, cx, cy, 10);
    terrain.layer.setCollision(SOLID_TILES);

    const colliders = this.collideTargets.map((target) =>
      this.scene.physics.add.collider(target, terrain.layer)
    );

    // spawn point lights for glowing tiles in this chunk
    const lights: Phaser.GameObjects.Light[] = [];
    if (this.useLights) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const wx = (cx * CHUNK_SIZE + x) * TILE_SIZE + TILE_SIZE / 2;
          const wy = (cy * CHUNK_SIZE + y) * TILE_SIZE + TILE_SIZE / 2;
          if (rows[y][x] === Tile.NEON_LAMP) {
            lights.push(this.scene.lights.addLight(wx, wy - 4, 170, 0xff2d95, 0.9));
          }
          if (rows[y][x] === Tile.LAMP_WHITE) {
            lights.push(this.scene.lights.addLight(wx, wy - 4, 180, 0xbfe8ff, 0.85));
          }
          if (rows[y][x] === Tile.POWER_CELL) {
            lights.push(this.scene.lights.addLight(wx, wy, 150, 0x7df9ff, 1.0));
          }
          if (rows[y][x] === Tile.HOLO_SIGN) {
            lights.push(this.scene.lights.addLight(wx, wy, 120, 0x00f0ff, 0.7));
          }
        }
      }
    }

    this.chunks.set(`${cx},${cy}`, {
      map: terrain.map,
      layer: terrain.layer,
      wallMap: wall.map,
      wallLayer: wall.layer,
      colliders,
      lights,
    });
  }

  private destroyChunk(key: string, chunk: Chunk): void {
    chunk.colliders.forEach((c) => c.destroy());
    chunk.lights.forEach((l) => this.scene.lights.removeLight(l));
    chunk.map.destroy(); // destroys the layer too
    chunk.wallMap.destroy();
    this.chunks.delete(key);
  }

  getTile(tx: number, ty: number): number {
    const { world } = this;
    if (tx < 0 || tx >= world.width || ty < 0 || ty >= world.height) return Tile.SUBSTRATE;
    return world.data[ty * world.width + tx];
  }

  /**
   * Blocks are data, not entities: mutate the world matrix and let the
   * owning chunk layer redraw the cell. Never spawn physics sprites here.
   * Background walls are untouched — mined tunnels keep their backdrop.
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
