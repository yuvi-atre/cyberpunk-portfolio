import { Tile } from './Tiles';

/**
 * Hand-authored city. No procedural noise: every tile is placed on purpose
 * so materials never mismatch and nothing spawns out of reach. The city is a
 * single guided street, left to right:
 *
 *   Spawn plaza -> Apartment (about / mentor) -> Market Street (frontend) ->
 *   Foundry (backend / legacy) -> Mega-Corp Tower (flagship, elevator to the
 *   executive deck) -> Exclusion Edge (future goals cache).
 *
 * Navigation is walk-through archways plus one elevator; there is no block
 * breaking. Skill shards float along the route and are collected by shooting
 * or touching them.
 */

export const WORLD_WIDTH = 176; // tiles
export const WORLD_HEIGHT = 44; // tiles
export const SURFACE_Y = 32; // first solid ground row

export interface WorldMarker {
  kind:
    | 'npc'
    | 'walker'
    | 'drone'
    | 'sign'
    | 'project'
    | 'chest'
    | 'billboard'
    | 'shard'
    | 'elevator';
  id: string;
  /** tile coordinates */
  tx: number;
  ty: number;
}

export interface CityWorld {
  width: number;
  height: number;
  data: Int16Array;
  /** background wall per cell (-1 = none); rendered behind the terrain layer */
  walls: Int16Array;
  markers: WorldMarker[];
  spawn: { tx: number; ty: number };
}

/** District boundaries (tile-x) — each column is exactly one material. */
const GREEN_END = 74; // < this: green zone
const METAL_END = 146; // < this: metal zone, >= this: rubble edge

export function buildCityMap(): CityWorld {
  const W = WORLD_WIDTH;
  const H = WORLD_HEIGHT;
  const S = SURFACE_Y;
  const data = new Int16Array(W * H).fill(Tile.AIR);
  const walls = new Int16Array(W * H).fill(Tile.AIR);
  const markers: WorldMarker[] = [];

  const set = (x: number, y: number, t: number) => {
    if (x >= 0 && x < W && y >= 0 && y < H) data[y * W + x] = t;
  };
  const setWall = (x: number, y: number, t: number) => {
    if (x >= 0 && x < W && y >= 0 && y < H) walls[y * W + x] = t;
  };
  const fill = (x0: number, y0: number, x1: number, y1: number, t: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, t);
  };
  const fillWall = (x0: number, y0: number, x1: number, y1: number, t: number) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setWall(x, y, t);
  };
  const mark = (kind: WorldMarker['kind'], id: string, tx: number, ty: number) =>
    markers.push({ kind, id, tx, ty });

  // ---- ground strata: one material family per district, dead flat ----
  for (let x = 0; x < W; x++) {
    const green = x < GREEN_END;
    const metal = x >= GREEN_END && x < METAL_END;
    set(x, S, green ? Tile.PAVEMENT : metal ? Tile.METAL_TOP : Tile.RUBBLE_TOP);
    for (let y = S + 1; y <= S + 5; y++)
      set(x, y, green ? Tile.SOIL : metal ? Tile.METAL : Tile.RUBBLE);
    for (let y = S + 6; y < H - 2; y++)
      set(x, y, green ? Tile.DEEP_SOIL : metal ? Tile.METAL_DARK : Tile.DEEP_SOIL);
  }
  // world shell: bottom slab + hazard-capped barrier walls at both ends.
  // Short riveted walls read as deliberate "city limits"; the old full-height
  // substrate pillars rendered as a black bar at the screen edge.
  fill(0, H - 2, W - 1, H - 1, Tile.SUBSTRATE);
  const barrier = (x0: number, x1: number) => {
    fill(x0, S - 6, x1, S - 1, Tile.PANEL_X);
    fill(x0, S - 7, x1, S - 7, Tile.HAZARD);
  };
  barrier(0, 1);
  barrier(W - 2, W - 1);

  // ---- spawn plaza ----
  const spawn = { tx: 6, ty: S - 3 };
  set(9, S - 1, Tile.HOLO_SIGN);
  mark('sign', 'sign-welcome', 9, S - 1);
  set(12, S - 1, Tile.NEON_LAMP);

  // ---- apartment block (about me / mentor / portfolio-meta monument) ----
  {
    const L = 14, R = 30, TOP = S - 12; // x 14..30, y 20..31
    fillWall(L, TOP, R, S - 1, Tile.WALL_RIVET);
    fill(L, TOP, R, TOP, Tile.BEAM); // roof
    fill(L, TOP + 1, L, S - 1, Tile.PANEL); // left wall
    fill(R, TOP + 1, R, S - 1, Tile.PANEL); // right wall
    // upper-floor slab with a jump-up gap on the right
    fill(L + 1, S - 6, L + 12, S - 6, Tile.BEAM);
    // back-wall windows (non-colliding dressing on the wall layer)
    for (const wx of [17, 21, 25]) fillWall(wx, S - 9, wx, S - 8, Tile.WALL_WINDOW);
    for (const wx of [18, 26]) fillWall(wx, S - 4, wx, S - 3, Tile.WALL_WINDOW);
    // ground-floor archways, dressed with door frames
    set(L, S - 2, Tile.DOOR_TOP);
    set(L, S - 1, Tile.DOOR);
    set(R, S - 2, Tile.DOOR_TOP);
    set(R, S - 1, Tile.DOOR);
    // interior lamps + a crate step up to the mezzanine
    set(20, TOP + 2, Tile.LAMP_WHITE);
    set(24, S - 7, Tile.LAMP_WHITE);
    set(28, S - 1, Tile.CRATE);
    // mezzanine reward shard
    mark('shard', 'java', 26, S - 9);
    mark('project', 'apartment', 22, S - 1);
    mark('npc', 'mentor-apartment', 18, S - 1);
    mark('billboard', 'sm-1', 22, TOP - 1);
  }

  // ---- residential street ----
  set(34, S - 1, Tile.NEON_LAMP);
  mark('shard', 'react', 34, S - 3);
  set(39, S - 1, Tile.CRATE);
  set(39, S - 2, Tile.CRATE);
  mark('shard', 'typescript', 39, S - 4);
  set(41, S - 1, Tile.NEON_LAMP);
  mark('walker', 'crowd', 36, S - 1);

  // ---- market street: two walk-through stalls ----
  const stall = (L: number, R: number) => {
    fillWall(L, S - 5, R, S - 1, Tile.WALL_PANEL);
    fill(L - 1, S - 5, R + 1, S - 5, Tile.AWNING); // overhanging awning roof
    fill(L, S - 4, L, S - 1, Tile.SHOPFRONT);
    fill(R, S - 4, R, S - 1, Tile.SHOPFRONT);
    set(L, S - 1, Tile.DOOR);
    set(R, S - 1, Tile.DOOR);
    fillWall(Math.floor((L + R) / 2), S - 3, Math.floor((L + R) / 2), S - 2, Tile.WALL_WINDOW);
  };
  stall(46, 52);
  stall(58, 64);
  set(49, S - 6, Tile.BOARD); // hanging shop board above stall A
  set(43, S - 1, Tile.HOLO_SIGN);
  mark('sign', 'sign-market', 43, S - 1);
  mark('npc', 'trader-market', 55, S - 1);
  mark('shard', 'phaser', 49, S - 8);
  mark('shard', 'node', 61, S - 8);
  mark('drone', 'drone-market', 55, S - 9);
  set(68, S - 1, Tile.NEON_LAMP);
  mark('walker', 'crowd', 70, S - 1);

  // ---- industrial gate ----
  set(75, S - 1, Tile.LAMP_WHITE);
  set(77, S - 1, Tile.HOLO_SIGN);
  mark('sign', 'sign-industrial', 77, S - 1);
  mark('billboard', 'lg-1', 74, S - 1);

  // ---- the foundry: one big machine hall (backend / legacy systems) ----
  {
    const L = 80, R = 108, TOP = S - 10; // x 80..108, y 22..31
    fillWall(L, TOP, R, S - 1, Tile.WALL_GRID);
    fill(L, TOP, R, TOP, Tile.BEAM); // roof
    fill(L, TOP + 1, L, S - 1, Tile.PANEL_X);
    fill(R, TOP + 1, R, S - 1, Tile.PANEL_X);
    // hazard trim under the roofline
    fill(L + 1, TOP + 1, R - 1, TOP + 1, Tile.HAZARD);
    // archways at both ends
    set(L, S - 2, Tile.DOOR_TOP);
    set(L, S - 1, Tile.DOOR);
    set(R, S - 2, Tile.DOOR_TOP);
    set(R, S - 1, Tile.DOOR);
    // catwalk platforms (double-jump reachable)
    fill(85, S - 5, 90, S - 5, Tile.BEAM);
    fill(97, S - 5, 102, S - 5, Tile.BEAM);
    // hanging utility lamps
    for (const wx of [84, 94, 104]) set(wx, TOP + 3, Tile.LAMP_WHITE);
    // floor dressing
    set(83, S - 1, Tile.SCRAP);
    set(103, S - 1, Tile.LOCKER);
    mark('npc', 'professor-foundry', 91, S - 1);
    mark('project', 'foundry', 98, S - 1);
    mark('shard', 'python', 87, S - 7);
    mark('shard', 'sql', 99, S - 7);
    mark('shard', 'docker', 105, S - 3);
  }

  // ---- corporate plaza ----
  set(112, S - 1, Tile.LAMP_WHITE);
  mark('billboard', 'lg-2', 111, S - 1);
  mark('walker', 'crowd', 113, S - 1);
  mark('drone', 'drone-plaza', 110, S - 10);
  set(115, S - 1, Tile.HOLO_SIGN);
  mark('sign', 'sign-tower', 115, S - 1);

  // ---- mega-corp tower: lobby + elevator + executive deck ----
  {
    const L = 118, R = 138;
    const ROOF = 4; // tower crown
    const DECK_FLOOR = 9; // executive deck floor row (deck air 5..8)
    const LOBBY_CEIL = S - 7; // y 25; lobby air 26..31
    fillWall(L, ROOF, R, S - 1, Tile.WALL_DARK);
    fill(L, ROOF, R, ROOF, Tile.BEAM); // crown
    fill(L, ROOF + 1, L, S - 1, Tile.PANEL); // outer walls, full height
    fill(R, ROOF + 1, R, S - 1, Tile.PANEL);
    fill(L + 1, DECK_FLOOR, R - 1, DECK_FLOOR, Tile.BEAM); // deck floor
    fill(L + 1, LOBBY_CEIL, R - 1, LOBBY_CEIL, Tile.BEAM); // lobby ceiling
    // solid mid-rise body with a lit window facade (never walked on)
    fill(L + 1, DECK_FLOOR + 1, R - 1, LOBBY_CEIL - 1, Tile.PANEL);
    for (const wx of [121, 124, 127, 130, 133, 136]) {
      for (let wy = DECK_FLOOR + 2; wy <= LOBBY_CEIL - 2; wy += 2) set(wx, wy, Tile.WINDOW);
    }
    // deck dressing: back-wall windows overlooking the city
    for (const wx of [122, 126, 130, 134]) fillWall(wx, 6, wx, 7, Tile.WALL_WINDOW);
    // lobby archways
    set(L, S - 2, Tile.DOOR_TOP);
    set(L, S - 1, Tile.DOOR);
    set(R, S - 2, Tile.DOOR_TOP);
    set(R, S - 1, Tile.DOOR);
    // elevator cab doors in the lobby and on the deck
    set(128, S - 2, Tile.DOOR_TOP);
    set(128, S - 1, Tile.DOOR);
    mark('elevator', 'tower', 128, S - 1);
    set(128, 7, Tile.DOOR_TOP);
    set(128, 8, Tile.DOOR);
    mark('elevator', 'tower', 128, 8);
    // lobby lamps + cast
    set(122, LOBBY_CEIL + 2, Tile.LAMP_WHITE);
    set(134, LOBBY_CEIL + 2, Tile.LAMP_WHITE);
    mark('npc', 'director-tower', 123, S - 1);
    // executive deck: flagship monument + the rarest shard
    set(120, 6, Tile.LAMP_WHITE);
    mark('project', 'megacorp', 133, 8);
    mark('shard', 'aws', 124, 6);
  }

  // ---- exclusion edge: curated wreckage + future-goals cache ----
  set(147, S - 1, Tile.FENCE);
  set(148, S - 1, Tile.FENCE);
  set(149, S - 1, Tile.HOLO_SIGN);
  mark('sign', 'sign-edge', 149, S - 1);
  set(152, S - 1, Tile.GIRDER);
  set(153, S - 1, Tile.GIRDER);
  set(153, S - 2, Tile.GIRDER);
  // broken ruin arch sheltering the cache
  fill(156, S - 4, 156, S - 1, Tile.PANEL_X);
  set(156, S - 5, Tile.GIRDER);
  fill(164, S - 3, 164, S - 1, Tile.PANEL_X);
  set(164, S - 4, Tile.GIRDER);
  fillWall(157, S - 4, 163, S - 1, Tile.WALL_DARK);
  set(160, S - 1, Tile.CACHE);
  mark('chest', 'future-goals', 160, S - 1);
  mark('shard', 'csharp', 160, S - 4);
  set(168, S - 1, Tile.GIRDER);

  return { width: W, height: H, data, walls, markers, spawn };
}
