import { Tile } from './Tiles';

/**
 * Static architectural blueprints (house, castle, pyramid, dungeons...)
 * that get embedded into the Perlin-generated terrain. Cells set to NOOP
 * keep whatever the procedural pass generated; AIR explicitly carves.
 *
 * Blueprints are built with a tiny grid-builder so coordinates are exact.
 * The embedder consumes a plain 2D grid, so these can be swapped for
 * parsed Tiled (.tmj) layer data without touching the generator.
 */

export const NOOP = -2;

export interface StructureMarker {
  kind: 'project' | 'npc' | 'sign' | 'chest';
  /** project id / experience id / sign id */
  id: string;
  dx: number;
  dy: number;
}

export interface Structure {
  width: number;
  height: number;
  cells: number[][];
  markers: StructureMarker[];
  /** Background wall placed behind every non-NOOP cell of the blueprint. */
  wallTile?: number;
}

class Blueprint {
  cells: number[][];
  markers: StructureMarker[] = [];

  constructor(
    public width: number,
    public height: number
  ) {
    this.cells = Array.from({ length: height }, () => new Array<number>(width).fill(NOOP));
  }

  set(x: number, y: number, tile: number): this {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) this.cells[y][x] = tile;
    return this;
  }

  fillRect(x: number, y: number, w: number, h: number, tile: number): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, tile);
    return this;
  }

  /** Solid box with carved interior. */
  room(x: number, y: number, w: number, h: number, wall: number): this {
    this.fillRect(x, y, w, h, wall);
    this.fillRect(x + 1, y + 1, w - 2, h - 2, Tile.AIR);
    return this;
  }

  /** Alternating battlement pattern along a row. */
  battlements(x: number, y: number, w: number): this {
    for (let i = 0; i < w; i++) this.set(x + i, y, i % 2 === 0 ? Tile.DARK_STONE : Tile.STONE_BRICK);
    return this;
  }

  marker(kind: StructureMarker['kind'], id: string, dx: number, dy: number): this {
    this.markers.push({ kind, id, dx, dy });
    return this;
  }

  build(wallTile?: number): Structure {
    return {
      width: this.width,
      height: this.height,
      cells: this.cells,
      markers: this.markers,
      wallTile,
    };
  }
}

/** Rustic two-story wooden starter house. Anchored so its bottom row replaces the surface row. */
export function buildHouse(): Structure {
  const b = new Blueprint(15, 10);
  b.room(0, 0, 15, 10, Tile.WOOD);
  // second-story floor divider
  b.fillRect(1, 4, 13, 1, Tile.WOOD);
  // windows punched into the outer walls
  b.set(0, 2, Tile.GLASS).set(14, 2, Tile.GLASS).set(0, 6, Tile.GLASS);
  // interior torches (sparse — heavy torch light flattens the wall shading)
  b.set(4, 2, Tile.TORCH).set(10, 6, Tile.TORCH);
  // doors on both walls so the ground floor is a walk-through
  b.set(14, 7, Tile.DOOR_TOP).set(14, 8, Tile.DOOR);
  b.set(0, 7, Tile.DOOR_TOP).set(0, 8, Tile.DOOR);
  b.marker('project', 'house', 14, 8);
  b.marker('npc', 'mentor-house', 19, 8);
  return b.build(Tile.WALL_WOOD);
}

/** Wrought-iron graveyard — "Deprecated Technologies". */
export function buildGraveyard(): Structure {
  const b = new Blueprint(14, 4);
  b.set(0, 2, Tile.FENCE).set(0, 3, Tile.FENCE);
  b.set(13, 2, Tile.FENCE).set(13, 3, Tile.FENCE);
  b.set(3, 3, Tile.GRAVESTONE).set(6, 3, Tile.GRAVESTONE).set(10, 3, Tile.GRAVESTONE);
  b.set(6, 2, Tile.SIGN);
  b.marker('sign', 'sign-graveyard', 6, 2);
  return b.build();
}

/** The central castle — flagship projects monument. */
export function buildCastle(): Structure {
  const b = new Blueprint(41, 22);
  // twin towers
  b.fillRect(0, 0, 7, 22, Tile.STONE_BRICK);
  b.fillRect(34, 0, 7, 22, Tile.STONE_BRICK);
  b.battlements(0, 0, 7);
  b.battlements(34, 0, 7);
  b.set(3, 2, Tile.GLASS).set(3, 6, Tile.GLASS);
  b.set(37, 2, Tile.GLASS).set(37, 6, Tile.GLASS);
  // main curtain wall
  b.fillRect(7, 9, 27, 13, Tile.STONE_BRICK);
  b.battlements(7, 9, 7);
  b.battlements(27, 9, 7);
  // central keep rising above the wall
  b.fillRect(14, 4, 13, 9, Tile.STONE_BRICK);
  b.battlements(14, 4, 13);
  // heraldic banners + keep windows
  b.set(16, 6, Tile.BANNER_RED).set(20, 6, Tile.BANNER_BLUE).set(24, 6, Tile.BANNER_YELLOW);
  b.set(18, 7, Tile.GLASS).set(22, 7, Tile.GLASS);
  b.set(10, 11, Tile.BANNER_RED).set(30, 11, Tile.BANNER_BLUE);
  b.set(12, 13, Tile.GLASS).set(28, 13, Tile.GLASS);
  // gate: carved opening with a raised portcullis (door tiles) and torches
  b.fillRect(18, 15, 5, 6, Tile.AIR);
  for (let x = 18; x <= 22; x++) b.set(x, 15, Tile.DOOR_TOP);
  b.set(18, 17, Tile.TORCH).set(22, 17, Tile.TORCH);
  b.marker('project', 'castle', 20, 19);
  b.marker('npc', 'manager-castle', -5, 21);
  b.marker('sign', 'sign-castle', -3, 20);
  return b.build(Tile.WALL_STONE_BRICK);
}

/** Stepped sandstone pyramid — legacy systems monument. */
export function buildPyramid(): Structure {
  const b = new Blueprint(33, 17);
  for (let r = 0; r < 17; r++) {
    b.fillRect(16 - r, r, 2 * r + 1, 1, Tile.SANDSTONE);
  }
  // burial chamber
  b.fillRect(11, 11, 11, 4, Tile.AIR);
  b.set(13, 12, Tile.TORCH).set(19, 12, Tile.TORCH);
  b.set(16, 14, Tile.CHEST);
  // entrance tunnel from the right face
  b.fillRect(21, 13, 12, 2, Tile.AIR);
  b.set(23, 13, Tile.TORCH);
  b.marker('project', 'pyramid', 30, 14);
  b.marker('npc', 'professor-pyramid', 38, 16);
  b.marker('sign', 'sign-desert', -4, 16);
  return b.build();
}

/** Red-brick basement under the house — structured foundations. */
export function buildBasement(): Structure {
  const b = new Blueprint(17, 9);
  b.room(0, 0, 17, 9, Tile.RED_BRICK);
  // room divider with a doorway
  b.fillRect(8, 1, 1, 7, Tile.RED_BRICK);
  b.set(8, 6, Tile.DOOR_TOP).set(8, 7, Tile.DOOR);
  b.set(3, 3, Tile.TORCH).set(12, 3, Tile.TORCH);
  b.set(14, 7, Tile.CHEST);
  b.set(4, 7, Tile.SIGN);
  b.marker('sign', 'sign-mines', 4, 7);
  return b.build(Tile.WALL_RED_BRICK);
}

/** Decorated stone-brick dungeon under the castle — deep expertise. */
export function buildDungeon(): Structure {
  const b = new Blueprint(29, 12);
  b.room(0, 0, 29, 12, Tile.STONE_BRICK);
  // hanging banners
  b.set(6, 1, Tile.BANNER_RED).set(14, 1, Tile.BANNER_BLUE).set(22, 1, Tile.BANNER_YELLOW);
  // dragon statue plinth
  b.fillRect(13, 8, 3, 3, Tile.DARK_STONE);
  b.set(13, 7, Tile.TORCH).set(15, 7, Tile.TORCH);
  b.set(3, 4, Tile.TORCH).set(25, 4, Tile.TORCH);
  b.set(25, 10, Tile.CHEST);
  return b.build(Tile.WALL_STONE_BRICK);
}

/** Remote sand island with the treasure chest — future goals. */
export function buildIsland(): Structure {
  const b = new Blueprint(13, 10);
  for (let r = 1; r < 10; r++) {
    const hw = Math.min(6, 1 + Math.floor(r * 0.8));
    b.fillRect(6 - hw, r, hw * 2 + 1, 1, Tile.SAND);
  }
  b.set(6, 0, Tile.CHEST);
  b.marker('chest', 'island-chest', 6, 0);
  return b.build();
}
