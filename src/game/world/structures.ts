import { Tile } from './Tiles';

/**
 * Static architectural blueprints (apartment block, mega-corp tower,
 * foundry...) that get embedded into the Perlin-generated terrain. Cells set
 * to NOOP keep whatever the procedural pass generated; AIR explicitly carves.
 *
 * Blueprints are built with a tiny grid-builder so coordinates are exact.
 * The embedder consumes a plain 2D grid, so these can be swapped for
 * parsed Tiled (.tmj) layer data without touching the generator.
 */

export const NOOP = -2;

export interface StructureMarker {
  kind: 'project' | 'npc' | 'sign' | 'chest' | 'drone' | 'walker' | 'billboard';
  /** project id / experience id / sign id / billboard ad key */
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

  /** Vertical strip of glowing window tiles. */
  windowColumn(x: number, y0: number, y1: number, step = 2): this {
    for (let y = y0; y <= y1; y += step) this.set(x, y, Tile.WINDOW);
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

/** Neon-lit apartment block — the starting "About Me" building. */
export function buildApartment(): Structure {
  const b = new Blueprint(15, 12);
  b.room(0, 2, 15, 10, Tile.PANEL);
  // rooftop parapet with hazard trim and an antenna girder
  b.fillRect(0, 2, 15, 1, Tile.BEAM);
  b.set(2, 1, Tile.GIRDER).set(2, 0, Tile.NEON_LAMP);
  // second-story floor divider
  b.fillRect(1, 7, 13, 1, Tile.BEAM);
  // glowing windows on both floors
  b.set(3, 4, Tile.WINDOW).set(7, 4, Tile.WINDOW).set(11, 4, Tile.WINDOW);
  b.set(3, 9, Tile.WINDOW).set(11, 9, Tile.WINDOW);
  // interior lamps
  b.set(5, 5, Tile.LAMP_WHITE).set(9, 9, Tile.LAMP_WHITE);
  // doors on both walls so the ground floor is a walk-through
  b.set(14, 10, Tile.DOOR_TOP).set(14, 11, Tile.DOOR);
  b.set(0, 10, Tile.DOOR_TOP).set(0, 11, Tile.DOOR);
  b.marker('project', 'apartment', 14, 11);
  b.marker('npc', 'mentor-apartment', 19, 11);
  b.marker('billboard', 'sm-1', 7, -1);
  return b.build(Tile.WALL_RIVET);
}

/** Fenced scrapyard — deprecated technologies, resting in pieces. */
export function buildScrapyard(): Structure {
  const b = new Blueprint(14, 4);
  b.set(0, 2, Tile.FENCE).set(0, 3, Tile.FENCE);
  b.set(13, 2, Tile.FENCE).set(13, 3, Tile.FENCE);
  b.set(3, 3, Tile.SCRAP).set(6, 3, Tile.SCRAP).set(7, 3, Tile.CRATE).set(10, 3, Tile.SCRAP);
  b.set(6, 2, Tile.BOARD);
  b.marker('sign', 'sign-scrapyard', 6, 2);
  return b.build();
}

/** Market Street — a neon strip of shopfront stalls and holo ads. */
export function buildMarketStreet(): Structure {
  const b = new Blueprint(34, 9);
  // two stall buildings with awning tops and glass fronts
  const stall = (x: number, w: number) => {
    b.room(x, 3, w, 6, Tile.PANEL);
    b.fillRect(x, 3, w, 1, Tile.AWNING);
    b.fillRect(x + 1, 4, w - 2, 1, Tile.SHOPFRONT);
    b.fillRect(x + 1, 5, w - 2, 1, Tile.SHOPFRONT_GLASS);
    b.set(x, 7, Tile.DOOR_TOP).set(x, 8, Tile.DOOR);
  };
  stall(1, 9);
  stall(24, 9);
  // central bar: taller, with a holo sign and wall screens
  b.room(12, 1, 10, 8, Tile.PANEL_X);
  b.fillRect(12, 1, 10, 1, Tile.BEAM);
  b.set(14, 3, Tile.WINDOW).set(19, 3, Tile.WINDOW);
  b.fillRect(13, 5, 8, 1, Tile.SHOPFRONT);
  b.set(12, 7, Tile.DOOR_TOP).set(12, 8, Tile.DOOR);
  b.set(21, 7, Tile.DOOR_TOP).set(21, 8, Tile.DOOR);
  // street furniture between the stalls
  b.set(10, 8, Tile.NEON_LAMP);
  b.set(23, 8, Tile.NEON_LAMP);
  b.set(11, 8, Tile.HOLO_SIGN);
  b.marker('sign', 'sign-market', 11, 8);
  b.marker('npc', 'trader-market', 17, 8);
  b.marker('walker', 'crowd', 5, 8);
  b.marker('walker', 'crowd', 28, 8);
  b.marker('billboard', 'lg-1', 15, 0);
  return b.build(Tile.WALL_WINDOW);
}

/** The Mega-Corp Tower — flagship projects monument, patrolled by drones. */
export function buildMegaCorpTower(): Structure {
  const b = new Blueprint(25, 34);
  // main shaft
  b.room(4, 4, 17, 30, Tile.PANEL);
  // crown: hazard-trim parapet with a rooftop billboard and beacon
  b.fillRect(4, 4, 17, 1, Tile.HAZARD);
  b.fillRect(9, 1, 7, 3, Tile.PANEL_X);
  b.fillRect(9, 1, 7, 1, Tile.BEAM);
  b.set(12, 0, Tile.NEON_LAMP);
  // corner reinforcement columns
  for (let y = 6; y < 33; y += 4) {
    b.set(4, y, Tile.PANEL_X);
    b.set(20, y, Tile.PANEL_X);
  }
  // glowing window grid up the facade
  b.windowColumn(7, 7, 29, 3);
  b.windowColumn(10, 7, 29, 3);
  b.windowColumn(14, 7, 29, 3);
  b.windowColumn(17, 7, 29, 3);
  // interior atrium floors (beams the player can climb via the gate)
  b.fillRect(6, 12, 8, 1, Tile.BEAM);
  b.fillRect(11, 19, 8, 1, Tile.BEAM);
  b.fillRect(6, 26, 8, 1, Tile.BEAM);
  b.set(8, 11, Tile.LAMP_WHITE).set(16, 18, Tile.LAMP_WHITE).set(8, 25, Tile.LAMP_WHITE);
  // lobby gate: carved opening with door tiles and lamps
  b.fillRect(10, 29, 5, 5, Tile.AIR);
  for (let x = 10; x <= 14; x++) b.set(x, 29, Tile.DOOR_TOP);
  b.set(9, 31, Tile.LAMP_WHITE).set(15, 31, Tile.LAMP_WHITE);
  b.marker('project', 'megacorp', 12, 33);
  b.marker('npc', 'director-tower', -4, 33);
  b.marker('sign', 'sign-tower', -2, 32);
  b.marker('drone', 'patrol', 2, 2);
  b.marker('drone', 'patrol', 23, 8);
  b.marker('billboard', 'lg-2', 10, 1);
  return b.build(Tile.WALL_GRID);
}

/** Stepped industrial foundry — the legacy-systems monument. */
export function buildFoundry(): Structure {
  const b = new Blueprint(33, 18);
  // stepped metal hull
  for (let r = 0; r < 8; r++) {
    b.fillRect(12 - r, 10 - r, 2 * r + 9, 1, Tile.METAL);
  }
  b.fillRect(4, 11, 25, 7, Tile.METAL);
  // smokestack
  b.fillRect(24, 2, 3, 9, Tile.METAL_DARK);
  b.set(25, 1, Tile.HAZARD);
  // machine hall carved inside
  b.fillRect(7, 12, 19, 5, Tile.AIR);
  b.fillRect(7, 16, 19, 1, Tile.HAZARD);
  b.set(9, 13, Tile.LAMP_WHITE).set(22, 13, Tile.LAMP_WHITE);
  b.set(11, 15, Tile.CRATE).set(12, 15, Tile.SCRAP).set(20, 15, Tile.LOCKER);
  b.set(16, 15, Tile.CACHE);
  // entrance tunnel from the right face
  b.fillRect(26, 14, 7, 2, Tile.AIR);
  b.set(28, 13, Tile.NEON_LAMP);
  b.marker('project', 'foundry', 30, 16);
  b.marker('npc', 'professor-foundry', 38, 17);
  b.marker('sign', 'sign-industrial', -4, 17);
  return b.build(Tile.WALL_METAL);
}

/** Maintenance tunnel under the apartment — structured foundations. */
export function buildMaintenanceTunnel(): Structure {
  const b = new Blueprint(17, 9);
  b.room(0, 0, 17, 9, Tile.METAL);
  // room divider with a doorway
  b.fillRect(8, 1, 1, 7, Tile.METAL);
  b.set(8, 6, Tile.DOOR_TOP).set(8, 7, Tile.DOOR);
  b.set(3, 3, Tile.LAMP_WHITE).set(12, 3, Tile.NEON_LAMP);
  b.set(14, 7, Tile.CACHE);
  b.set(4, 7, Tile.HOLO_SIGN);
  b.set(2, 7, Tile.LOCKER);
  b.marker('sign', 'sign-undercity', 4, 7);
  return b.build(Tile.WALL_GRID);
}

/** Server vault deep under the tower — deep expertise. */
export function buildServerVault(): Structure {
  const b = new Blueprint(29, 12);
  b.room(0, 0, 29, 12, Tile.PANEL_X);
  // server racks along the back wall
  for (let x = 4; x <= 24; x += 4) {
    b.set(x, 9, Tile.LOCKER).set(x, 10, Tile.LOCKER);
  }
  b.set(6, 1, Tile.LAMP_WHITE).set(14, 1, Tile.NEON_LAMP).set(22, 1, Tile.LAMP_WHITE);
  // power core plinth
  b.fillRect(13, 8, 3, 3, Tile.METAL_DARK);
  b.set(14, 7, Tile.POWER_CELL);
  b.set(26, 10, Tile.CACHE);
  return b.build(Tile.WALL_DARK);
}

/** Collapsed ruin at the exclusion-zone edge holding the future-goals cache. */
export function buildEdgeRuin(): Structure {
  const b = new Blueprint(13, 8);
  // broken rubble mound with a girder skeleton poking out
  for (let r = 1; r < 8; r++) {
    const hw = Math.min(6, 1 + Math.floor(r * 0.8));
    b.fillRect(6 - hw, r, hw * 2 + 1, 1, Tile.RUBBLE);
  }
  b.set(2, 3, Tile.GIRDER).set(10, 4, Tile.GIRDER);
  b.set(6, 1, Tile.RUBBLE_TOP);
  b.set(6, 0, Tile.CACHE);
  b.marker('chest', 'edge-cache', 6, 0);
  return b.build();
}
