import { PerlinNoise, hash2D } from './PerlinNoise';
import { Tile, BLOCK_TYPE_TO_TILE } from './Tiles';
import {
  buildBasement,
  buildCastle,
  buildDungeon,
  buildGraveyard,
  buildHouse,
  buildIsland,
  buildPyramid,
  NOOP,
  type Structure,
} from './structures';
import { PortfolioService } from '../../services/PortfolioService';

/**
 * Deterministic world generation. A constant seed guarantees every visitor
 * sees exactly the same world — resume content can never generate out of
 * reach. Perlin fBm shapes the terrain and caves; static blueprints are
 * embedded on top; portfolio.json drives ore, NPC, sign and monument
 * placement.
 */

export const WORLD_SEED = 20260701;
export const WORLD_WIDTH = 512; // tiles
export const WORLD_HEIGHT = 200; // tiles
export const WATER_LEVEL = 70; // world row where ocean water begins

/** Zone anchors (tile-x of each structure's left edge). */
export const ZONES = {
  spawnX: 20,
  houseX: 26,
  graveyardX: 58,
  castleX: 100,
  desertStart: 155,
  pyramidX: 200,
  desertEnd: 330,
  beachStart: 335,
  oceanStart: 362,
  islandX: 414,
} as const;

export interface WorldMarker {
  kind: 'project' | 'npc' | 'sign' | 'chest';
  id: string;
  /** tile coordinates */
  tx: number;
  ty: number;
}

export interface GeneratedWorld {
  width: number;
  height: number;
  data: Int16Array;
  /** background wall per cell (-1 = none); rendered behind the terrain layer */
  walls: Int16Array;
  /** surface row per column */
  surface: number[];
  /** tile index (ty * width + tx) -> skill id */
  oreMap: Map<number, string>;
  markers: WorldMarker[];
  spawn: { tx: number; ty: number };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function generateWorld(): GeneratedWorld {
  const noise = new PerlinNoise(WORLD_SEED);
  const W = WORLD_WIDTH;
  const H = WORLD_HEIGHT;
  const data = new Int16Array(W * H).fill(Tile.AIR);
  const walls = new Int16Array(W * H).fill(Tile.AIR);
  const oreMap = new Map<number, string>();
  const markers: WorldMarker[] = [];

  const idx = (x: number, y: number) => y * W + x;
  const setWall = (x: number, y: number, t: number) => {
    if (x >= 0 && x < W && y >= 0 && y < H) walls[idx(x, y)] = t;
  };
  const get = (x: number, y: number) =>
    x < 0 || x >= W || y < 0 || y >= H ? Tile.BEDROCK : data[idx(x, y)];
  const set = (x: number, y: number, t: number) => {
    if (x >= 0 && x < W && y >= 0 && y < H) data[idx(x, y)] = t;
  };

  // ---- 1. Surface heightmap: rolling plains -> flat desert -> sea floor ----
  const surface: number[] = new Array(W);
  for (let x = 0; x < W; x++) {
    const n = noise.fbm(x * 0.02, 0, 4, 0.5);
    const plains = 64 + n * 8;
    const desert = 65 + n * 3;
    const ocean = 80 + n * 3;
    const wDesert =
      smoothstep(ZONES.desertStart - 12, ZONES.desertStart + 4, x) *
      (1 - smoothstep(ZONES.desertEnd, ZONES.beachStart + 8, x));
    const wOcean = smoothstep(ZONES.beachStart + 8, ZONES.oceanStart + 10, x);
    let h = plains * (1 - wDesert - wOcean) + desert * wDesert + ocean * wOcean;
    surface[x] = Math.round(h);
  }

  // Flatten ground under each structure footprint so buildings sit level.
  const flatten = (x0: number, w: number) => {
    const mid = surface[Math.min(W - 1, x0 + Math.floor(w / 2))];
    for (let x = Math.max(0, x0 - 1); x < Math.min(W, x0 + w + 1); x++) surface[x] = mid;
    return mid;
  };
  const houseS = flatten(ZONES.houseX, 15);
  const graveS = flatten(ZONES.graveyardX, 14);
  const castleS = flatten(ZONES.castleX, 41);
  const pyramidS = flatten(ZONES.pyramidX, 33);

  // ---- 2. Column fill: air / topsoil / stone, with desert strata ----
  for (let x = 0; x < W; x++) {
    const s = surface[x];
    const inDesert = x >= ZONES.desertStart - 6 && x <= ZONES.beachStart + 10;
    const sandy = inDesert || x > ZONES.beachStart - 6;
    for (let y = s; y < H; y++) {
      if (y === s) set(x, y, sandy ? Tile.SAND : Tile.GRASS);
      else if (y <= s + 5) set(x, y, sandy ? Tile.SAND : Tile.DIRT);
      else if (sandy && y <= s + 14) set(x, y, Tile.SANDSTONE);
      else set(x, y, Tile.STONE);
      // background wall: caves and mined tunnels must never show sky
      if (y > s) {
        const depth = y - s;
        if (sandy && depth <= 14) setWall(x, y, Tile.WALL_SANDSTONE);
        else if (depth <= 18) setWall(x, y, Tile.WALL_DIRT);
        else setWall(x, y, Tile.WALL_STONE);
      }
    }
    // ocean water above the sea floor
    if (s > WATER_LEVEL) {
      for (let y = WATER_LEVEL; y < s; y++) set(x, y, Tile.WATER);
    }
  }

  // ---- 3. Caves: worm tunnels + large caverns, with biome dressing ----
  for (let x = 2; x < W - 2; x++) {
    const s = surface[x];
    for (let y = s + 6; y < H - 4; y++) {
      const worm = noise.fbm(x * 0.06, y * 0.06, 3, 0.5);
      const cavern = noise.fbm(x * 0.028 + 100, y * 0.028, 3, 0.5);
      if (Math.abs(worm) < 0.085 || cavern > 0.46) {
        set(x, y, Tile.AIR);
      }
    }
  }

  // Biome dressing pass: moss, vines, crystals, flooded caverns, torches.
  const temp = (x: number, y: number) => noise.fbm(x * 0.012 + 500, y * 0.012, 2, 0.5);
  const moist = (x: number, y: number) => noise.fbm(x * 0.012 + 900, y * 0.012 + 300, 2, 0.5);
  for (let x = 2; x < W - 2; x++) {
    const s = surface[x];
    for (let y = s + 6; y < H - 4; y++) {
      const t = get(x, y);
      if (t === Tile.AIR) {
        // flooded caverns in cold/wet regions of the deep
        if (y > 115 && temp(x, y) < -0.12) {
          set(x, y, Tile.WATER);
          continue;
        }
        const above = get(x, y - 1);
        // hanging vines under mossy overgrowth
        if (above === Tile.MOSSY_STONE && hash2D(x, y, 11) < 0.5) {
          set(x, y, Tile.VINE);
          continue;
        }
        // sparse torches to guide spelunking recruiters
        if (get(x, y + 1) === Tile.STONE && hash2D(x, y, 23) < 0.02) {
          set(x, y, Tile.TORCH);
        }
      } else if (t === Tile.STONE) {
        const nearAir =
          get(x - 1, y) === Tile.AIR ||
          get(x + 1, y) === Tile.AIR ||
          get(x, y - 1) === Tile.AIR ||
          get(x, y + 1) === Tile.AIR;
        if (!nearAir) continue;
        if (y < 118 && moist(x, y) > 0.18 && temp(x, y) > 0.05) {
          set(x, y, Tile.MOSSY_STONE); // overgrown cavern biome
        } else if (y > 108 && temp(x, y) < -0.08 && hash2D(x, y, 31) < 0.2) {
          set(x, y, Tile.CRYSTAL_BLUE); // glowing flooded-cavern crystals
        }
      }
    }
  }

  // ---- 4. Skill ores, driven entirely by portfolio.json ----
  const skills = PortfolioService.skills;
  for (let x = 2; x < W - 2; x++) {
    const s = surface[x];
    for (let y = s + 4; y < H - 4; y++) {
      if (get(x, y) !== Tile.STONE) continue;
      const depth = y - s;
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        if (depth < skill.spawnDepth[0] || depth > skill.spawnDepth[1]) continue;
        if (hash2D(x, y, WORLD_SEED + i * 101) < skill.abundance / 2600) {
          const tile = BLOCK_TYPE_TO_TILE[skill.blockType] ?? Tile.ORE_SILVER;
          set(x, y, tile);
          oreMap.set(idx(x, y), skill.id);
          // small 2-tile vein for visual weight
          if (get(x + 1, y) === Tile.STONE && hash2D(x, y, 77) < 0.6) {
            set(x + 1, y, tile);
            oreMap.set(idx(x + 1, y), skill.id);
          }
          break;
        }
      }
    }
  }

  // ---- 5. Surface flora: trees on the plains, cacti in the desert ----
  const structureSpans: Array<[number, number]> = [
    [ZONES.houseX - 2, ZONES.houseX + 17],
    [ZONES.graveyardX - 2, ZONES.graveyardX + 16],
    [ZONES.castleX - 4, ZONES.castleX + 45],
    [ZONES.pyramidX - 4, ZONES.pyramidX + 37],
  ];
  const inStructure = (x: number) => structureSpans.some(([a, b]) => x >= a && x <= b);

  for (let x = 8; x < ZONES.desertStart - 6; x += 1) {
    if (x % 6 !== 0 || inStructure(x) || hash2D(x, 7, WORLD_SEED) > 0.4) continue;
    const s = surface[x];
    if (get(x, s) !== Tile.GRASS) continue;
    const trunkH = 4 + Math.floor(hash2D(x, 8, WORLD_SEED) * 2);
    for (let i = 1; i <= trunkH; i++) set(x, s - i, Tile.LOG);
    for (let ly = s - trunkH - 2; ly <= s - trunkH; ly++) {
      for (let lx = x - 2; lx <= x + 2; lx++) {
        if (get(lx, ly) === Tile.AIR && hash2D(lx, ly, 13) < 0.92) set(lx, ly, Tile.LEAVES);
      }
    }
  }
  for (let x = ZONES.desertStart + 4; x < ZONES.desertEnd; x++) {
    if (x % 9 !== 0 || inStructure(x) || hash2D(x, 9, WORLD_SEED) > 0.35) continue;
    const s = surface[x];
    if (get(x, s) !== Tile.SAND) continue;
    const h = 2 + Math.floor(hash2D(x, 10, WORLD_SEED) * 2);
    for (let i = 1; i <= h; i++) set(x, s - i, Tile.CACTUS);
  }

  // ---- 6. Embed static blueprints into the terrain ----
  const embed = (st: Structure, ox: number, oy: number) => {
    for (let y = 0; y < st.height; y++) {
      for (let x = 0; x < st.width; x++) {
        const c = st.cells[y][x];
        if (c === NOOP) continue;
        set(ox + x, oy + y, c);
        // interiors get the structure's own wall material behind them
        if (st.wallTile !== undefined) setWall(ox + x, oy + y, st.wallTile);
      }
    }
    for (const m of st.markers) {
      markers.push({ kind: m.kind, id: m.id, tx: ox + m.dx, ty: oy + m.dy });
    }
  };

  const house = buildHouse();
  embed(house, ZONES.houseX, houseS - house.height + 1);
  const graveyard = buildGraveyard();
  embed(graveyard, ZONES.graveyardX, graveS - graveyard.height + 1);
  const castle = buildCastle();
  embed(castle, ZONES.castleX, castleS - castle.height + 1);
  const pyramid = buildPyramid();
  embed(pyramid, ZONES.pyramidX, pyramidS - pyramid.height + 1);

  // hidden basement under the house and dungeon under the castle —
  // discovered by mining down (block placement lets players climb back out)
  const basement = buildBasement();
  embed(basement, ZONES.houseX - 1, houseS + 2);

  const dungeon = buildDungeon();
  embed(dungeon, ZONES.castleX + 6, castleS + 5);

  // treasure island rising out of the ocean
  const island = buildIsland();
  embed(island, ZONES.islandX, WATER_LEVEL - 4);

  // ---- 7. Standalone signs (welcome + ocean) placed from portfolio zones ----
  const spawnSign = { tx: ZONES.spawnX - 3, ty: surface[ZONES.spawnX - 3] - 1 };
  set(spawnSign.tx, spawnSign.ty, Tile.SIGN);
  markers.push({ kind: 'sign', id: 'sign-welcome', tx: spawnSign.tx, ty: spawnSign.ty });

  const oceanSignX = ZONES.beachStart + 8;
  const oceanSign = { tx: oceanSignX, ty: surface[oceanSignX] - 1 };
  set(oceanSign.tx, oceanSign.ty, Tile.SIGN);
  markers.push({ kind: 'sign', id: 'sign-ocean', tx: oceanSign.tx, ty: oceanSign.ty });

  // ---- 8. World shell: bedrock floor and side walls ----
  for (let x = 0; x < W; x++) {
    set(x, H - 1, Tile.BEDROCK);
    set(x, H - 2, Tile.BEDROCK);
  }
  for (let y = 0; y < H; y++) {
    set(0, y, Tile.BEDROCK);
    set(W - 1, y, Tile.BEDROCK);
  }

  return {
    width: W,
    height: H,
    data,
    walls,
    surface,
    oreMap,
    markers,
    spawn: { tx: ZONES.spawnX, ty: surface[ZONES.spawnX] - 3 },
  };
}
