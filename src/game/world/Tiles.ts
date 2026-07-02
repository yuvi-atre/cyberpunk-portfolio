/**
 * Tile registry. Every block in the world is an integer index into the
 * procedurally generated tileset texture (see BootScene). -1 means air.
 */
export const TILE_SIZE = 18; // matches Kenney Pixel Platformer tile size

export enum Tile {
  AIR = -1,
  GRASS = 0,
  DIRT = 1,
  STONE = 2,
  SAND = 3,
  SANDSTONE = 4,
  WOOD = 5,
  LOG = 6,
  LEAVES = 7,
  STONE_BRICK = 8,
  RED_BRICK = 9,
  WATER = 10,
  GLASS = 11,
  DOOR = 12,
  TORCH = 13,
  ORE_GOLD = 14,
  ORE_SILVER = 15,
  CRYSTAL_BLUE = 16,
  MOSSY_STONE = 17,
  VINE = 18,
  CACTUS = 19,
  GRAVESTONE = 20,
  FENCE = 21,
  SIGN = 22,
  CHEST = 23,
  BEDROCK = 24,
  ORE_COPPER = 25,
  ORE_EMERALD = 26,
  BANNER_RED = 27,
  BANNER_BLUE = 28,
  BANNER_YELLOW = 29,
  DARK_STONE = 30,
  STONE_SLAB = 31,
  DOOR_TOP = 32,
}

export const TILE_COUNT = 33;

/** Tiles the player collides with. */
export const SOLID_TILES: number[] = [
  Tile.GRASS,
  Tile.DIRT,
  Tile.STONE,
  Tile.SAND,
  Tile.SANDSTONE,
  Tile.WOOD,
  Tile.LOG,
  Tile.STONE_BRICK,
  Tile.RED_BRICK,
  Tile.GLASS,
  Tile.ORE_GOLD,
  Tile.ORE_SILVER,
  Tile.CRYSTAL_BLUE,
  Tile.MOSSY_STONE,
  Tile.BEDROCK,
  Tile.ORE_COPPER,
  Tile.ORE_EMERALD,
  Tile.DARK_STONE,
  Tile.STONE_SLAB,
];

/** Tiles that can never be mined. */
export const UNBREAKABLE_TILES: number[] = [
  Tile.BEDROCK,
  Tile.DOOR,
  Tile.DOOR_TOP,
  Tile.CHEST,
  Tile.SIGN,
];

/** Ore tile ids — mining these yields a skill item. */
export const ORE_TILES: number[] = [
  Tile.ORE_GOLD,
  Tile.ORE_SILVER,
  Tile.CRYSTAL_BLUE,
  Tile.ORE_COPPER,
  Tile.ORE_EMERALD,
];

/** Maps portfolio.json skill blockType strings to tile ids. */
export const BLOCK_TYPE_TO_TILE: Record<string, Tile> = {
  ore_gold: Tile.ORE_GOLD,
  ore_silver: Tile.ORE_SILVER,
  crystal_blue: Tile.CRYSTAL_BLUE,
  ore_copper: Tile.ORE_COPPER,
  ore_emerald: Tile.ORE_EMERALD,
};

/** Base palette per tile (from DESIGN.md world palette). */
export const TILE_COLORS: Record<number, { base: string; accent: string; dark: string }> = {
  [Tile.GRASS]: { base: '#5daa3e', accent: '#7cc95a', dark: '#6e4a2f' },
  [Tile.DIRT]: { base: '#6e4a2f', accent: '#82593a', dark: '#573a24' },
  [Tile.STONE]: { base: '#7a7a85', accent: '#8f8f9a', dark: '#5f5f6a' },
  [Tile.SAND]: { base: '#e4cf7a', accent: '#f0dd90', dark: '#c9b25e' },
  [Tile.SANDSTONE]: { base: '#c9a95c', accent: '#d9bb70', dark: '#a8894a' },
  [Tile.WOOD]: { base: '#8a5c33', accent: '#9c6c40', dark: '#6f4826' },
  [Tile.LOG]: { base: '#6b4423', accent: '#7d5230', dark: '#54351b' },
  [Tile.LEAVES]: { base: '#3f8f2e', accent: '#55ab42', dark: '#2f701f' },
  [Tile.STONE_BRICK]: { base: '#565660', accent: '#6a6a75', dark: '#404049' },
  [Tile.RED_BRICK]: { base: '#7d3b30', accent: '#93493c', dark: '#622c23' },
  [Tile.WATER]: { base: '#2662d9', accent: '#3f7ce8', dark: '#1c4cad' },
  [Tile.GLASS]: { base: '#b8dcf0', accent: '#ddf0fa', dark: '#8fbcd8' },
  [Tile.DOOR]: { base: '#75492a', accent: '#8a5c33', dark: '#5c3820' },
  [Tile.TORCH]: { base: '#ffb02e', accent: '#ffd76a', dark: '#8a5c33' },
  [Tile.ORE_GOLD]: { base: '#7a7a85', accent: '#ffcf40', dark: '#5f5f6a' },
  [Tile.ORE_SILVER]: { base: '#7a7a85', accent: '#d8dce8', dark: '#5f5f6a' },
  [Tile.CRYSTAL_BLUE]: { base: '#4b4b58', accent: '#54c8f0', dark: '#383842' },
  [Tile.MOSSY_STONE]: { base: '#5d7a52', accent: '#4ec455', dark: '#46603c' },
  [Tile.VINE]: { base: '#3f8f2e', accent: '#4ec455', dark: '#2f701f' },
  [Tile.CACTUS]: { base: '#4a9440', accent: '#5fae54', dark: '#39762f' },
  [Tile.GRAVESTONE]: { base: '#8f8f9a', accent: '#a5a5b0', dark: '#6a6a75' },
  [Tile.FENCE]: { base: '#3a3a42', accent: '#4a4a55', dark: '#2a2a30' },
  [Tile.SIGN]: { base: '#8a5c33', accent: '#9c6c40', dark: '#6f4826' },
  [Tile.CHEST]: { base: '#8a5c33', accent: '#c8a84b', dark: '#6f4826' },
  [Tile.BEDROCK]: { base: '#33333b', accent: '#44444e', dark: '#222228' },
  [Tile.ORE_COPPER]: { base: '#7a7a85', accent: '#d3803f', dark: '#5f5f6a' },
  [Tile.ORE_EMERALD]: { base: '#7a7a85', accent: '#4ec455', dark: '#5f5f6a' },
  [Tile.BANNER_RED]: { base: '#a03028', accent: '#c8433a', dark: '#7d2620' },
  [Tile.BANNER_BLUE]: { base: '#2a4fa0', accent: '#3a68c8', dark: '#203d7d' },
  [Tile.BANNER_YELLOW]: { base: '#c8a020', accent: '#e8c040', dark: '#a08018' },
  [Tile.DARK_STONE]: { base: '#45454f', accent: '#565660', dark: '#33333b' },
  [Tile.STONE_SLAB]: { base: '#8a8a95', accent: '#9c9ca8', dark: '#6f6f7a' },
  [Tile.DOOR_TOP]: { base: '#75492a', accent: '#8a5c33', dark: '#5c3820' },
};
