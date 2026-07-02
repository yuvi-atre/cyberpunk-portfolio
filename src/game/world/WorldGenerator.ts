import { PerlinNoise, hash2D } from './PerlinNoise';
import { Tile, BLOCK_TYPE_TO_TILE } from './Tiles';
import {
  buildApartment,
  buildEdgeRuin,
  buildFoundry,
  buildMaintenanceTunnel,
  buildMarketStreet,
  buildMegaCorpTower,
  buildScrapyard,
  buildServerVault,
  NOOP,
  type Structure,
} from './structures';
import { PortfolioService } from '../../services/PortfolioService';

/**
 * Deterministic world generation. A constant seed guarantees every visitor
 * sees exactly the same city — resume content can never generate out of
 * reach. Perlin fBm shapes the street elevations and the undercity caves;
 * static blueprints are embedded on top; portfolio.json drives data-node,
 * NPC, sign and monument placement.
 *
 * City districts, left to right:
 *   Residential Area (About Me) -> Market Street (frontend / UI work) ->
 *   Industrial Zone (backend / legacy) -> Corporate District (flagship) ->
 *   Exclusion Zone (future goals).
 */

export const WORLD_SEED = 20260701;
export const WORLD_WIDTH = 512; // tiles
export const WORLD_HEIGHT = 200; // tiles

/** District anchors (tile-x). */
export const ZONES = {
  spawnX: 20,
  apartmentX: 26,
  scrapyardX: 62,
  marketX: 100,
  industrialStart: 176,
  foundryX: 210,
  corpStart: 330,
  towerX: 360,
  exclusionStart: 440,
  ruinX: 478,
} as const;

export interface WorldMarker {
  kind: 'project' | 'npc' | 'sign' | 'chest' | 'drone' | 'walker' | 'billboard';
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
    x < 0 || x >= W || y < 0 || y >= H ? Tile.SUBSTRATE : data[idx(x, y)];
  const set = (x: number, y: number, t: number) => {
    if (x >= 0 && x < W && y >= 0 && y < H) data[idx(x, y)] = t;
  };

  /** Which district a column belongs to. */
  const isMetal = (x: number) => x >= ZONES.industrialStart && x < ZONES.exclusionStart;
  const isRubble = (x: number) => x >= ZONES.exclusionStart;

  // ---- 1. Surface heightmap: gentle streets, rougher wasteland edge ----
  const surface: number[] = new Array(W);
  for (let x = 0; x < W; x++) {
    const n = noise.fbm(x * 0.02, 0, 4, 0.5);
    const streets = 64 + n * 6;
    const wasteland = 62 + n * 12;
    const wWaste = smoothstep(ZONES.exclusionStart - 10, ZONES.exclusionStart + 10, x);
    surface[x] = Math.round(streets * (1 - wWaste) + wasteland * wWaste);
  }

  // Flatten ground under each structure footprint so buildings sit level.
  const flatten = (x0: number, w: number) => {
    const mid = surface[Math.min(W - 1, x0 + Math.floor(w / 2))];
    for (let x = Math.max(0, x0 - 1); x < Math.min(W, x0 + w + 1); x++) surface[x] = mid;
    return mid;
  };
  const apartmentS = flatten(ZONES.apartmentX, 15);
  const scrapS = flatten(ZONES.scrapyardX, 14);
  const marketS = flatten(ZONES.marketX, 34);
  const foundryS = flatten(ZONES.foundryX, 33);
  const towerS = flatten(ZONES.towerX, 25);
  const ruinS = flatten(ZONES.ruinX, 13);

  // ---- 2. Column fill: surface strata per district, undercity below ----
  for (let x = 0; x < W; x++) {
    const s = surface[x];
    for (let y = s; y < H; y++) {
      const depth = y - s;
      if (isMetal(x)) {
        if (depth === 0) set(x, y, Tile.METAL_TOP);
        else if (depth <= 5) set(x, y, Tile.METAL);
        else set(x, y, Tile.METAL_DARK);
      } else if (isRubble(x)) {
        if (depth === 0) set(x, y, Tile.RUBBLE_TOP);
        else if (depth <= 5) set(x, y, Tile.RUBBLE);
        else set(x, y, Tile.DEEP_SOIL);
      } else {
        if (depth === 0) set(x, y, Tile.PAVEMENT);
        else if (depth <= 5) set(x, y, Tile.SOIL);
        else set(x, y, Tile.DEEP_SOIL);
      }
      // background wall: caves and mined tunnels must never show sky
      if (depth > 0) {
        if (depth <= 18) setWall(x, y, isMetal(x) ? Tile.WALL_METAL : Tile.WALL_SOIL);
        else setWall(x, y, Tile.WALL_DARK);
      }
    }
  }

  // ---- 3. Undercity caves: worm tunnels + large caverns ----
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

  // Dressing pass: coolant floods, power cells, guide lamps.
  const temp = (x: number, y: number) => noise.fbm(x * 0.012 + 500, y * 0.012, 2, 0.5);
  for (let x = 2; x < W - 2; x++) {
    const s = surface[x];
    for (let y = s + 6; y < H - 4; y++) {
      const t = get(x, y);
      if (t === Tile.AIR) {
        // flooded coolant reservoirs in cold regions of the deep
        if (y > 115 && temp(x, y) < -0.12) {
          set(x, y, Tile.COOLANT);
          continue;
        }
        // sparse utility lamps to guide spelunking recruiters
        const below = get(x, y + 1);
        if ((below === Tile.DEEP_SOIL || below === Tile.METAL_DARK) && hash2D(x, y, 23) < 0.02) {
          set(x, y, isMetal(x) ? Tile.LAMP_WHITE : Tile.NEON_LAMP);
        }
      } else if (t === Tile.DEEP_SOIL || t === Tile.METAL_DARK) {
        const nearAir =
          get(x - 1, y) === Tile.AIR ||
          get(x + 1, y) === Tile.AIR ||
          get(x, y - 1) === Tile.AIR ||
          get(x, y + 1) === Tile.AIR;
        if (!nearAir) continue;
        // glowing power cells stud the flooded deep
        if (y > 108 && temp(x, y) < -0.08 && hash2D(x, y, 31) < 0.2) {
          set(x, y, Tile.POWER_CELL);
        }
      }
    }
  }

  // ---- 4. Skill data-nodes, driven entirely by portfolio.json ----
  const skills = PortfolioService.skills;
  for (let x = 2; x < W - 2; x++) {
    const s = surface[x];
    for (let y = s + 4; y < H - 4; y++) {
      const t = get(x, y);
      if (t !== Tile.DEEP_SOIL && t !== Tile.METAL_DARK) continue;
      const depth = y - s;
      for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        if (depth < skill.spawnDepth[0] || depth > skill.spawnDepth[1]) continue;
        if (hash2D(x, y, WORLD_SEED + i * 101) < skill.abundance / 2600) {
          const tile = BLOCK_TYPE_TO_TILE[skill.blockType] ?? Tile.DATA_CYAN;
          set(x, y, tile);
          oreMap.set(idx(x, y), skill.id);
          // small 2-tile vein for visual weight
          const right = get(x + 1, y);
          if ((right === Tile.DEEP_SOIL || right === Tile.METAL_DARK) && hash2D(x, y, 77) < 0.6) {
            set(x + 1, y, tile);
            oreMap.set(idx(x + 1, y), skill.id);
          }
          break;
        }
      }
    }
  }

  // ---- 5. Street furniture: lamps, fences, crates, girder wreckage ----
  const structureSpans: Array<[number, number]> = [
    [ZONES.apartmentX - 2, ZONES.apartmentX + 17],
    [ZONES.scrapyardX - 2, ZONES.scrapyardX + 16],
    [ZONES.marketX - 2, ZONES.marketX + 36],
    [ZONES.foundryX - 4, ZONES.foundryX + 37],
    [ZONES.towerX - 4, ZONES.towerX + 29],
    [ZONES.ruinX - 2, ZONES.ruinX + 15],
  ];
  const inStructure = (x: number) => structureSpans.some(([a, b]) => x >= a && x <= b);

  for (let x = 8; x < W - 8; x++) {
    if (inStructure(x)) continue;
    const s = surface[x];
    const ground = get(x, s);
    if (isRubble(x)) {
      // bent girders poking out of the wasteland
      if (x % 7 === 0 && hash2D(x, 9, WORLD_SEED) < 0.4) {
        set(x, s - 1, Tile.GIRDER);
        if (hash2D(x, 10, WORLD_SEED) < 0.4) set(x, s - 2, Tile.GIRDER);
      }
    } else if (isMetal(x)) {
      // crate and scrap stacks along the industrial road
      if (x % 11 === 0 && hash2D(x, 8, WORLD_SEED) < 0.5 && ground === Tile.METAL_TOP) {
        set(x, s - 1, hash2D(x, 12, WORLD_SEED) < 0.5 ? Tile.CRATE : Tile.SCRAP);
        if (hash2D(x, 13, WORLD_SEED) < 0.25) set(x, s - 2, Tile.CRATE);
      }
      if (x % 17 === 0) set(x, s - 1, Tile.LAMP_WHITE);
    } else {
      // neon street lamps and fence runs through the residential district
      if (x % 13 === 0 && ground === Tile.PAVEMENT) set(x, s - 1, Tile.NEON_LAMP);
      if (x % 13 === 5 && hash2D(x, 7, WORLD_SEED) < 0.35 && ground === Tile.PAVEMENT) {
        set(x, s - 1, Tile.FENCE);
        set(x + 1, s - 1, Tile.FENCE);
      }
    }
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

  const apartment = buildApartment();
  embed(apartment, ZONES.apartmentX, apartmentS - apartment.height + 1);
  const scrapyard = buildScrapyard();
  embed(scrapyard, ZONES.scrapyardX, scrapS - scrapyard.height + 1);
  const market = buildMarketStreet();
  embed(market, ZONES.marketX, marketS - market.height + 1);
  const foundry = buildFoundry();
  embed(foundry, ZONES.foundryX, foundryS - foundry.height + 1);
  const tower = buildMegaCorpTower();
  embed(tower, ZONES.towerX, towerS - tower.height + 1);

  // hidden rooms under the city — discovered by mining down (block
  // placement lets players climb back out)
  const tunnel = buildMaintenanceTunnel();
  embed(tunnel, ZONES.apartmentX - 1, apartmentS + 2);

  const vault = buildServerVault();
  embed(vault, ZONES.towerX - 2, towerS + 5);

  // collapsed ruin at the world's edge holding the future-goals cache
  const ruin = buildEdgeRuin();
  embed(ruin, ZONES.ruinX, ruinS - ruin.height + 1);

  // ---- 7. Standalone holo signs bookending the city ----
  const spawnSign = { tx: ZONES.spawnX - 3, ty: surface[ZONES.spawnX - 3] - 1 };
  set(spawnSign.tx, spawnSign.ty, Tile.HOLO_SIGN);
  markers.push({ kind: 'sign', id: 'sign-welcome', tx: spawnSign.tx, ty: spawnSign.ty });

  const edgeSignX = ZONES.exclusionStart + 6;
  const edgeSign = { tx: edgeSignX, ty: surface[edgeSignX] - 1 };
  set(edgeSign.tx, edgeSign.ty, Tile.HOLO_SIGN);
  markers.push({ kind: 'sign', id: 'sign-edge', tx: edgeSign.tx, ty: edgeSign.ty });

  // ambient pedestrians strolling the residential and corporate streets
  for (const wx of [42, 84, 160, 344, 415]) {
    markers.push({ kind: 'walker', id: 'crowd', tx: wx, ty: surface[wx] - 1 });
  }

  // ---- 8. World shell: substrate floor and side walls ----
  for (let x = 0; x < W; x++) {
    set(x, H - 1, Tile.SUBSTRATE);
    set(x, H - 2, Tile.SUBSTRATE);
  }
  for (let y = 0; y < H; y++) {
    set(0, y, Tile.SUBSTRATE);
    set(W - 1, y, Tile.SUBSTRATE);
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
