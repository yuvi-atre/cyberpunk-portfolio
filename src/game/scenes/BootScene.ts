import Phaser from 'phaser';
import { TILE_COLORS, TILE_COUNT, TILE_SIZE, Tile } from '../world/Tiles';
import { hash2D } from '../world/PerlinNoise';
import kenneyMainUrl from '../../assets/kenney/pixel-platformer.png';
import kenneyRockUrl from '../../assets/kenney/rock_packed.png';
import kenneyStoneUrl from '../../assets/kenney/stone_packed.png';
import kenneySandUrl from '../../assets/kenney/sand_packed.png';
import kenneyMarbleUrl from '../../assets/kenney/marble_packed.png';

/**
 * Builds the game tileset by compositing Kenney's CC0 Pixel Platformer art
 * (18x18) into one indexed strip, with procedural overlays for the tiles the
 * packs don't cover (torches, banners, ores, glass, chests...). Character
 * sprites, particles and parallax backdrops remain fully procedural.
 */

// (sheet, columns, index) source references — indices verified against the packs
const MAIN = { key: 'kenney-main', cols: 20 };
const ROCK = { key: 'kenney-rock', cols: 9 };
const TERRACOTTA = { key: 'kenney-stone', cols: 9 };
const SANDPACK = { key: 'kenney-sand', cols: 9 };
const MARBLE = { key: 'kenney-marble', cols: 9 };

interface SourceRef {
  sheet: { key: string; cols: number };
  index: number;
  alpha?: number;
}

const KENNEY_MAP: Partial<Record<Tile, SourceRef>> = {
  [Tile.GRASS]: { sheet: MAIN, index: 21 },
  [Tile.DIRT]: { sheet: MAIN, index: 24 },
  [Tile.SAND]: { sheet: MAIN, index: 141 },
  [Tile.WOOD]: { sheet: MAIN, index: 6 },
  [Tile.LOG]: { sheet: MAIN, index: 116 },
  [Tile.LEAVES]: { sheet: MAIN, index: 37 },
  [Tile.WATER]: { sheet: MAIN, index: 54, alpha: 0.78 },
  [Tile.FENCE]: { sheet: MAIN, index: 106 },
  [Tile.SIGN]: { sheet: MAIN, index: 85 },
  [Tile.CACTUS]: { sheet: MAIN, index: 127 },
  [Tile.DOOR_TOP]: { sheet: MAIN, index: 130 },
  [Tile.DOOR]: { sheet: MAIN, index: 150 },
  [Tile.STONE]: { sheet: ROCK, index: 64 },
  [Tile.STONE_BRICK]: { sheet: ROCK, index: 16 },
  [Tile.DARK_STONE]: { sheet: ROCK, index: 6 },
  [Tile.BEDROCK]: { sheet: ROCK, index: 43 },
  [Tile.RED_BRICK]: { sheet: TERRACOTTA, index: 16 },
  [Tile.SANDSTONE]: { sheet: SANDPACK, index: 16 },
  [Tile.STONE_SLAB]: { sheet: MARBLE, index: 37 },
};

const GEM = { sheet: MAIN, index: 67 };

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.load.image('kenney-main', kenneyMainUrl);
    this.load.image('kenney-rock', kenneyRockUrl);
    this.load.image('kenney-stone', kenneyStoneUrl);
    this.load.image('kenney-sand', kenneySandUrl);
    this.load.image('kenney-marble', kenneyMarbleUrl);
  }

  create(): void {
    this.makeTileset();
    this.makeCharacter('player', { shirt: '#3a7bd5', pants: '#5a3d28', hair: '#6b4423', skin: '#eab387' });
    this.makeCharacter('npc-0', { shirt: '#8e44ad', pants: '#2c3e50', hair: '#4a4a4a', skin: '#e8c39e' });
    this.makeCharacter('npc-1', { shirt: '#c0392b', pants: '#34495e', hair: '#2c2c2c', skin: '#d9a066' });
    this.makeCharacter('npc-2', { shirt: '#d4a017', pants: '#4a3520', hair: '#e8e8e8', skin: '#eab387' });
    this.makeParticle();
    this.makeSky();
    this.makeSun();
    this.makeFarRidge();
    this.makeMountains();
    this.makeHills();
    this.makeClouds();
    this.scene.start('Game');
  }

  private ctxFor(key: string, w: number, h: number): CanvasRenderingContext2D {
    const tex = this.textures.createCanvas(key, w, h)!;
    return tex.getContext();
  }

  private refresh(key: string): void {
    (this.textures.get(key) as Phaser.Textures.CanvasTexture).refresh();
  }

  private sourceImage(key: string): CanvasImageSource {
    return this.textures.get(key).getSourceImage() as CanvasImageSource;
  }

  // ---------------------------------------------------------------- tileset
  private makeTileset(): void {
    const T = TILE_SIZE;
    const STRIDE = T + 2; // 1px extruded margin per side prevents WebGL seam bleeding
    const ctx = this.ctxFor('tiles', TILE_COUNT * STRIDE, STRIDE);
    ctx.imageSmoothingEnabled = false;
    const cellX = (i: number) => i * STRIDE + 1;

    const blit = (ref: SourceRef, destTile: number) => {
      const img = this.sourceImage(ref.sheet.key);
      const sx = (ref.index % ref.sheet.cols) * T;
      const sy = Math.floor(ref.index / ref.sheet.cols) * T;
      ctx.globalAlpha = ref.alpha ?? 1;
      ctx.drawImage(img, sx, sy, T, T, cellX(destTile), 1, T, T);
      ctx.globalAlpha = 1;
    };

    /** Run a local-coordinate draw function inside a tile cell. */
    const inCell = (tile: number, draw: (c: CanvasRenderingContext2D) => void) => {
      ctx.save();
      ctx.translate(cellX(tile), 1);
      draw(ctx);
      ctx.restore();
    };

    // straight Kenney tiles
    for (const [tileStr, ref] of Object.entries(KENNEY_MAP)) {
      blit(ref, Number(tileStr));
    }

    // subtle tone shifts: browner dirt and darker stone so the underground
    // reads distinctly from the sunlit desert sand
    inCell(Tile.DIRT, (c) => {
      c.fillStyle = 'rgba(92, 56, 28, 0.22)';
      c.fillRect(0, 0, T, T);
    });
    inCell(Tile.STONE, (c) => {
      c.fillStyle = 'rgba(38, 42, 60, 0.28)';
      c.fillRect(0, 0, T, T);
    });

    // leaf canopies: break up the flat fill with darker clusters and holes
    inCell(Tile.LEAVES, (c) => {
      for (let y = 0; y < T; y += 2) {
        for (let x = 0; x < T; x += 2) {
          const r = hash2D(x, y, 91);
          if (r < 0.22) {
            c.fillStyle = 'rgba(47, 112, 31, 0.9)';
            c.fillRect(x, y, 2, 2);
          } else if (r > 0.93) {
            c.clearRect(x, y, 2, 2);
          }
        }
      }
    });

    // ores: Kenney stone base + colored nuggets from the skill palette
    const ores: Array<[Tile, string]> = [
      [Tile.ORE_GOLD, TILE_COLORS[Tile.ORE_GOLD].accent],
      [Tile.ORE_SILVER, TILE_COLORS[Tile.ORE_SILVER].accent],
      [Tile.ORE_COPPER, TILE_COLORS[Tile.ORE_COPPER].accent],
      [Tile.ORE_EMERALD, TILE_COLORS[Tile.ORE_EMERALD].accent],
    ];
    for (const [tile, color] of ores) {
      blit({ sheet: ROCK, index: 64 }, tile);
      inCell(tile, (c) => this.drawNuggets(c, color));
    }

    // crystal: darkened stone base + the Kenney gem
    blit({ sheet: ROCK, index: 64 }, Tile.CRYSTAL_BLUE);
    inCell(Tile.CRYSTAL_BLUE, (c) => {
      c.fillStyle = 'rgba(10, 12, 30, 0.45)';
      c.fillRect(0, 0, T, T);
    });
    blit(GEM, Tile.CRYSTAL_BLUE);

    // mossy stone: stone base + moss cap and speckles
    blit({ sheet: ROCK, index: 64 }, Tile.MOSSY_STONE);
    inCell(Tile.MOSSY_STONE, (c) => this.drawMoss(c));

    // fully procedural specials
    inCell(Tile.GLASS, (c) => this.drawGlass(c));
    inCell(Tile.TORCH, (c) => this.drawTorch(c));
    inCell(Tile.VINE, (c) => this.drawVine(c));
    inCell(Tile.GRAVESTONE, (c) => this.drawGravestone(c));
    inCell(Tile.CHEST, (c) => this.drawChest(c));
    inCell(Tile.BANNER_RED, (c) => this.drawBanner(c, Tile.BANNER_RED));
    inCell(Tile.BANNER_BLUE, (c) => this.drawBanner(c, Tile.BANNER_BLUE));
    inCell(Tile.BANNER_YELLOW, (c) => this.drawBanner(c, Tile.BANNER_YELLOW));

    // background walls: smooth panel textures (visually distinct from the
    // facade tiles) heavily darkened so interiors read as depth, not solids
    const wallRefs: Array<[Tile, SourceRef]> = [
      [Tile.WALL_DIRT, { sheet: TERRACOTTA, index: 37 }],
      [Tile.WALL_STONE, { sheet: ROCK, index: 37 }],
      [Tile.WALL_WOOD, { sheet: SANDPACK, index: 37 }],
      [Tile.WALL_RED_BRICK, { sheet: TERRACOTTA, index: 16 }],
      [Tile.WALL_STONE_BRICK, { sheet: ROCK, index: 16 }],
      [Tile.WALL_SANDSTONE, { sheet: SANDPACK, index: 16 }],
    ];
    for (const [wall, ref] of wallRefs) {
      blit(ref, wall);
      inCell(wall, (c) => {
        c.fillStyle = 'rgba(12, 10, 22, 0.62)';
        c.fillRect(0, 0, T, T);
      });
    }

    // edge extrusion: copy each tile's border pixels into its 1px margin
    for (let i = 0; i < TILE_COUNT; i++) {
      const x = cellX(i);
      ctx.drawImage(ctx.canvas, x, 1, T, 1, x, 0, T, 1); // top
      ctx.drawImage(ctx.canvas, x, T, T, 1, x, T + 1, T, 1); // bottom
      ctx.drawImage(ctx.canvas, x, 1, 1, T, x - 1, 1, 1, T); // left
      ctx.drawImage(ctx.canvas, x + T - 1, 1, 1, T, x + T, 1, 1, T); // right
    }

    this.refresh('tiles');
  }

  private drawNuggets(ctx: CanvasRenderingContext2D, color: string): void {
    const spots = [
      [4, 4], [11, 3], [13, 9], [6, 10], [3, 13], [10, 13],
    ];
    for (const [sx, sy] of spots) {
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy, 3, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  private drawMoss(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#4ec455';
    ctx.fillRect(0, 0, 18, 4);
    for (let x = 0; x < 18; x += 2) {
      if (hash2D(x, 4, 17) < 0.55) ctx.fillRect(x, 4, 2, 2);
      if (hash2D(x, 6, 17) < 0.2) ctx.fillRect(x, 6, 2, 2);
    }
    ctx.fillStyle = '#7cc95a';
    for (let x = 1; x < 18; x += 4) ctx.fillRect(x, 1, 1, 1);
  }

  private drawGlass(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(184, 220, 240, 0.45)';
    ctx.fillRect(0, 0, 18, 18);
    ctx.strokeStyle = 'rgba(143, 188, 216, 0.9)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 17, 17);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(4, 2, 2, 7);
    ctx.fillRect(7, 6, 1, 5);
  }

  private drawTorch(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8a5c33';
    ctx.fillRect(8, 7, 2, 10);
    ctx.fillStyle = '#ffb02e';
    ctx.fillRect(7, 2, 4, 6);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(8, 3, 2, 4);
    ctx.fillStyle = 'rgba(255, 176, 46, 0.30)';
    ctx.fillRect(5, 0, 8, 9);
  }

  private drawVine(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#3f8f2e';
    ctx.fillRect(8, 0, 2, 18);
    ctx.fillStyle = '#4ec455';
    ctx.fillRect(6, 3, 2, 2);
    ctx.fillRect(10, 8, 2, 2);
    ctx.fillRect(6, 13, 2, 2);
  }

  private drawGravestone(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8f8f9a';
    ctx.fillRect(5, 5, 8, 13);
    ctx.fillRect(6, 3, 6, 2);
    ctx.fillStyle = '#a5a5b0';
    ctx.fillRect(5, 5, 1, 13);
    ctx.fillStyle = '#6a6a75';
    ctx.fillRect(7, 7, 4, 1);
    ctx.fillRect(7, 9, 4, 1);
  }

  private drawChest(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8a5c33';
    ctx.fillRect(2, 5, 14, 13);
    ctx.fillStyle = '#6f4826';
    ctx.fillRect(2, 5, 14, 2);
    ctx.fillStyle = '#c8a84b';
    ctx.fillRect(2, 10, 14, 2);
    ctx.fillRect(8, 9, 2, 4);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(8, 10, 2, 2);
  }

  private drawBanner(ctx: CanvasRenderingContext2D, tile: Tile): void {
    const c = TILE_COLORS[tile];
    ctx.fillStyle = '#565660';
    ctx.fillRect(0, 0, 18, 2);
    ctx.fillStyle = c.base;
    ctx.fillRect(4, 2, 10, 13);
    ctx.fillStyle = c.accent;
    ctx.fillRect(6, 4, 6, 2);
    ctx.fillStyle = c.dark;
    ctx.fillRect(4, 13, 10, 2);
    ctx.fillRect(6, 15, 6, 2);
  }

  // ------------------------------------------------------------- characters
  private makeCharacter(
    key: string,
    p: { shirt: string; pants: string; hair: string; skin: string }
  ): void {
    const FRAMES = 4;
    const W = 16;
    const H = 24;
    const ctx = this.ctxFor(key, W * FRAMES, H);
    for (let f = 0; f < FRAMES; f++) {
      ctx.save();
      ctx.translate(f * W, 0);
      // hair + head
      ctx.fillStyle = p.hair;
      ctx.fillRect(4, 0, 8, 3);
      ctx.fillRect(3, 1, 2, 4);
      ctx.fillStyle = p.skin;
      ctx.fillRect(5, 3, 7, 5);
      ctx.fillStyle = '#222';
      ctx.fillRect(10, 4, 1, 2); // eye (faces right)
      // torso + arms
      ctx.fillStyle = p.shirt;
      ctx.fillRect(4, 8, 8, 7);
      const armSwing = f === 1 ? 1 : f === 3 ? -1 : 0;
      ctx.fillRect(3 - armSwing, 9, 2, 5);
      ctx.fillRect(11 + armSwing, 9, 2, 5);
      ctx.fillStyle = p.skin;
      ctx.fillRect(3 - armSwing, 13, 2, 2);
      ctx.fillRect(11 + armSwing, 13, 2, 2);
      // legs: 4 frames = idle, step L, pass, step R
      ctx.fillStyle = p.pants;
      const legOff = f === 1 ? 2 : f === 3 ? -2 : 0;
      ctx.fillRect(5 + Math.min(0, legOff), 15, 3, 8);
      ctx.fillRect(9 + Math.max(0, legOff), 15, 3, 8);
      // boots
      ctx.fillStyle = '#3c2a18';
      ctx.fillRect(5 + Math.min(0, legOff), 22, 3, 2);
      ctx.fillRect(9 + Math.max(0, legOff), 22, 3, 2);
      ctx.restore();
    }
    this.refresh(key);
    // register frames on the canvas texture
    const tex = this.textures.get(key);
    for (let f = 0; f < FRAMES; f++) {
      tex.add(f, 0, f * W, 0, W, H);
    }
  }

  private makeParticle(): void {
    const ctx = this.ctxFor('particle', 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);
    this.refresh('particle');
  }

  // ---------------------------------------------------------------- parallax
  private makeSky(): void {
    const ctx = this.ctxFor('sky', 32, 512);
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#6aa3dd');
    grad.addColorStop(0.55, '#87b5e5');
    grad.addColorStop(1, '#b8d4ee');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 512);
    this.refresh('sky');
  }

  /** Chunky pixel sun with a soft halo. */
  private makeSun(): void {
    const S = 64;
    const ctx = this.ctxFor('sun', S, S);
    const cx = S / 2;
    // stepped pixel circle
    const draw = (r: number, color: string) => {
      ctx.fillStyle = color;
      for (let y = -r; y <= r; y += 2) {
        const half = Math.floor(Math.sqrt(r * r - y * y) / 2) * 2;
        ctx.fillRect(cx - half, cx + y, half * 2, 2);
      }
    };
    draw(28, 'rgba(255, 236, 170, 0.28)');
    draw(20, '#ffe9a8');
    draw(15, '#ffd76a');
    this.refresh('sun');
  }

  /** Palest, most distant ridge line — adds a third depth plane. */
  private makeFarRidge(): void {
    const W = 512;
    const H = 220;
    const ctx = this.ctxFor('farridge', W, H);
    ctx.fillStyle = '#8fadd0';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const t = x / W;
      const y =
        120 - 55 * (0.7 * Math.sin(t * Math.PI * 2 + 2.4) + 0.3 * Math.sin(t * Math.PI * 6 + 0.6));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    this.refresh('farridge');
  }

  private makeMountains(): void {
    const W = 512;
    const H = 256;
    const ctx = this.ctxFor('mountains', W, H);
    // two ridge lines for depth, drawn with deterministic hash offsets
    const ridge = (color: string, base: number, amp: number, seed: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) {
        const t = x / W;
        // sum of sines keeps the texture perfectly tileable horizontally
        const y =
          base -
          amp *
            (0.6 * Math.sin(t * Math.PI * 4 + seed) +
              0.3 * Math.sin(t * Math.PI * 8 + seed * 2) +
              0.1 * Math.sin(t * Math.PI * 16 + seed * 3));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    };
    ridge('#5f87b8', 150, 70, 1.7);
    ridge('#4e719e', 190, 55, 4.2);
    this.refresh('mountains');
  }

  private makeHills(): void {
    const W = 512;
    const H = 200;
    const ctx = this.ctxFor('hills', W, H);
    ctx.fillStyle = '#57905f';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const t = x / W;
      const y = 110 - 45 * (0.7 * Math.sin(t * Math.PI * 2 + 0.8) + 0.3 * Math.sin(t * Math.PI * 6 + 2.1));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a7d52';
    ctx.fillRect(0, 150, W, 50);
    this.refresh('hills');
  }

  private makeClouds(): void {
    const W = 512;
    const H = 128;
    const ctx = this.ctxFor('clouds', W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const blob = (x: number, y: number, s: number) => {
      ctx.fillRect(x, y + s, s * 4, s);
      ctx.fillRect(x + s, y, s * 2, s);
    };
    blob(40, 30, 8);
    blob(150, 78, 5);
    blob(220, 55, 6);
    blob(310, 90, 4);
    blob(380, 24, 10);
    blob(470, 62, 5);
    this.refresh('clouds');
  }
}
