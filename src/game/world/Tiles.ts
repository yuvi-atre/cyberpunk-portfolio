/**
 * Tile registry. Every block in the world is an integer index into the
 * tileset strip composited in BootScene from the CraftPix cyberpunk packs.
 * -1 means air.
 */
export const TILE_SIZE = 32; // CraftPix cyberpunk tilesets are 32x32

export enum Tile {
  AIR = -1,
  // terrain
  PAVEMENT = 0, // residential surface (green-zone top)
  SOIL = 1,
  DEEP_SOIL = 2,
  METAL_TOP = 3, // industrial surface plate
  METAL = 4,
  METAL_DARK = 5,
  RUBBLE_TOP = 6, // exclusion-zone surface
  RUBBLE = 7,
  // buildings
  PANEL = 8,
  PANEL_X = 9,
  WINDOW = 10,
  SHOPFRONT = 11,
  SHOPFRONT_GLASS = 12,
  AWNING = 13,
  DOOR = 14,
  DOOR_TOP = 15,
  BEAM = 16,
  GIRDER = 17,
  HAZARD = 18,
  CRATE = 19,
  // dressing & interactives
  NEON_LAMP = 20, // magenta street lamp (light source)
  LAMP_WHITE = 21, // cold white utility lamp (light source)
  FENCE = 22,
  SCRAP = 23,
  LOCKER = 24,
  BOARD = 25,
  HOLO_SIGN = 26,
  CACHE = 27, // data cache (chest)
  COOLANT = 28, // swimmable liquid in the deep undercity
  SUBSTRATE = 29, // unbreakable world shell
  // data nodes — mining these yields skills from portfolio.json
  DATA_AMBER = 30,
  DATA_CYAN = 31,
  DATA_MAGENTA = 32,
  DATA_GREEN = 33,
  POWER_CELL = 34, // glowing cell (light source)
  // background walls — rendered on a separate non-colliding layer
  WALL_PANEL = 35,
  WALL_RIVET = 36,
  WALL_WINDOW = 37,
  WALL_DARK = 38,
  WALL_GRID = 39,
  WALL_SOIL = 40,
  WALL_METAL = 41,
}

export const TILE_COUNT = 42;

export const WALL_TILES: number[] = [
  Tile.WALL_PANEL,
  Tile.WALL_RIVET,
  Tile.WALL_WINDOW,
  Tile.WALL_DARK,
  Tile.WALL_GRID,
  Tile.WALL_SOIL,
  Tile.WALL_METAL,
];

/** Tiles the player collides with. */
export const SOLID_TILES: number[] = [
  Tile.PAVEMENT,
  Tile.SOIL,
  Tile.DEEP_SOIL,
  Tile.METAL_TOP,
  Tile.METAL,
  Tile.METAL_DARK,
  Tile.RUBBLE_TOP,
  Tile.RUBBLE,
  Tile.PANEL,
  Tile.PANEL_X,
  Tile.WINDOW,
  Tile.SHOPFRONT,
  Tile.SHOPFRONT_GLASS,
  Tile.AWNING,
  Tile.BEAM,
  Tile.GIRDER,
  Tile.HAZARD,
  Tile.CRATE,
  Tile.SCRAP,
  Tile.LOCKER,
  Tile.SUBSTRATE,
  Tile.DATA_AMBER,
  Tile.DATA_CYAN,
  Tile.DATA_MAGENTA,
  Tile.DATA_GREEN,
  Tile.POWER_CELL,
];

/** Tiles that can never be broken. */
export const UNBREAKABLE_TILES: number[] = [
  Tile.SUBSTRATE,
  Tile.DOOR,
  Tile.DOOR_TOP,
  Tile.CACHE,
  Tile.HOLO_SIGN,
];

/** Data-node tile ids — breaking these yields a skill item. */
export const ORE_TILES: number[] = [
  Tile.DATA_AMBER,
  Tile.DATA_CYAN,
  Tile.DATA_MAGENTA,
  Tile.DATA_GREEN,
  Tile.POWER_CELL,
];

/** Maps portfolio.json skill blockType strings to tile ids. */
export const BLOCK_TYPE_TO_TILE: Record<string, Tile> = {
  data_amber: Tile.DATA_AMBER,
  data_cyan: Tile.DATA_CYAN,
  data_magenta: Tile.DATA_MAGENTA,
  data_green: Tile.DATA_GREEN,
  power_cell: Tile.POWER_CELL,
};

/** Base palette per tile — drives break particles and node glow colors. */
export const TILE_COLORS: Record<number, { base: string; accent: string; dark: string }> = {
  [Tile.PAVEMENT]: { base: '#3f4a52', accent: '#5dbb63', dark: '#2b333a' },
  [Tile.SOIL]: { base: '#3a3347', accent: '#4a4258', dark: '#2a2536' },
  [Tile.DEEP_SOIL]: { base: '#2c2638', accent: '#3a3347', dark: '#201c2b' },
  [Tile.METAL_TOP]: { base: '#4c5570', accent: '#6b7694', dark: '#363d52' },
  [Tile.METAL]: { base: '#454e68', accent: '#5b6584', dark: '#323950' },
  [Tile.METAL_DARK]: { base: '#343a50', accent: '#454e68', dark: '#262b3c' },
  [Tile.RUBBLE_TOP]: { base: '#5a6470', accent: '#8b96a3', dark: '#3c434c' },
  [Tile.RUBBLE]: { base: '#4a3742', accent: '#5d4753', dark: '#362832' },
  [Tile.PANEL]: { base: '#3d4560', accent: '#525c7c', dark: '#2c3248' },
  [Tile.PANEL_X]: { base: '#39405a', accent: '#4d5674', dark: '#292f44' },
  [Tile.WINDOW]: { base: '#3d4560', accent: '#00f0ff', dark: '#2c3248' },
  [Tile.SHOPFRONT]: { base: '#3d4560', accent: '#ffb020', dark: '#2c3248' },
  [Tile.SHOPFRONT_GLASS]: { base: '#3d4560', accent: '#ffb020', dark: '#2c3248' },
  [Tile.AWNING]: { base: '#c97b1e', accent: '#ffb020', dark: '#8a5414' },
  [Tile.DOOR]: { base: '#39405a', accent: '#00f0ff', dark: '#292f44' },
  [Tile.DOOR_TOP]: { base: '#39405a', accent: '#00f0ff', dark: '#292f44' },
  [Tile.BEAM]: { base: '#4c5570', accent: '#ffb020', dark: '#363d52' },
  [Tile.GIRDER]: { base: '#513a3f', accent: '#6e4f55', dark: '#3a2a2e' },
  [Tile.HAZARD]: { base: '#7c3a52', accent: '#ff4b4b', dark: '#54263a' },
  [Tile.CRATE]: { base: '#4c5570', accent: '#6b7694', dark: '#363d52' },
  [Tile.NEON_LAMP]: { base: '#ff2d95', accent: '#ff7cc0', dark: '#454e68' },
  [Tile.LAMP_WHITE]: { base: '#bfe8ff', accent: '#ffffff', dark: '#454e68' },
  [Tile.FENCE]: { base: '#454e68', accent: '#5b6584', dark: '#323950' },
  [Tile.SCRAP]: { base: '#5b5040', accent: '#7d6e57', dark: '#403830' },
  [Tile.LOCKER]: { base: '#3d4560', accent: '#525c7c', dark: '#2c3248' },
  [Tile.BOARD]: { base: '#4a4258', accent: '#ff2d95', dark: '#332d40' },
  [Tile.HOLO_SIGN]: { base: '#102030', accent: '#00f0ff', dark: '#0a1420' },
  [Tile.CACHE]: { base: '#4c5570', accent: '#ffb020', dark: '#363d52' },
  [Tile.COOLANT]: { base: '#0e6f6f', accent: '#19c8c8', dark: '#0a4a4a' },
  [Tile.SUBSTRATE]: { base: '#1a1626', accent: '#241f33', dark: '#120f1c' },
  [Tile.DATA_AMBER]: { base: '#454e68', accent: '#ffb020', dark: '#323950' },
  [Tile.DATA_CYAN]: { base: '#454e68', accent: '#00f0ff', dark: '#323950' },
  [Tile.DATA_MAGENTA]: { base: '#454e68', accent: '#ff2d95', dark: '#323950' },
  [Tile.DATA_GREEN]: { base: '#454e68', accent: '#3dff8c', dark: '#323950' },
  [Tile.POWER_CELL]: { base: '#343a50', accent: '#7df9ff', dark: '#262b3c' },
};
