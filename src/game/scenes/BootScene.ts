import Phaser from 'phaser';
import { TILE_COLORS, TILE_COUNT, TILE_SIZE, Tile } from '../world/Tiles';
import { hash2D } from '../world/PerlinNoise';

/**
 * Generates every texture procedurally on canvas — tileset, character
 * sprites, parallax backdrops, particles. No binary assets ship with the
 * repo, which keeps first paint nearly instant.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.makeTileset();
    this.makeCharacter('player', { shirt: '#3a7bd5', pants: '#5a3d28', hair: '#6b4423', skin: '#eab387' });
    this.makeCharacter('npc-0', { shirt: '#8e44ad', pants: '#2c3e50', hair: '#4a4a4a', skin: '#e8c39e' });
    this.makeCharacter('npc-1', { shirt: '#c0392b', pants: '#34495e', hair: '#2c2c2c', skin: '#d9a066' });
    this.makeCharacter('npc-2', { shirt: '#d4a017', pants: '#4a3520', hair: '#e8e8e8', skin: '#eab387' });
    this.makeParticle();
    this.makeSky();
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

  // ---------------------------------------------------------------- tileset
  private makeTileset(): void {
    const ctx = this.ctxFor('tiles', TILE_COUNT * TILE_SIZE, TILE_SIZE);
    for (let i = 0; i < TILE_COUNT; i++) {
      this.drawTile(ctx, i, i * TILE_SIZE);
    }
    this.refresh('tiles');
  }

  /** Base block: fill + deterministic speckle + top highlight + bottom shade. */
  private baseBlock(ctx: CanvasRenderingContext2D, ox: number, tile: number): void {
    const c = TILE_COLORS[tile];
    ctx.fillStyle = c.base;
    ctx.fillRect(ox, 0, 16, 16);
    for (let y = 0; y < 16; y += 2) {
      for (let x = 0; x < 16; x += 2) {
        const r = hash2D(ox + x, y, tile * 7 + 3);
        if (r < 0.18) {
          ctx.fillStyle = c.accent;
          ctx.fillRect(ox + x, y, 2, 2);
        } else if (r > 0.85) {
          ctx.fillStyle = c.dark;
          ctx.fillRect(ox + x, y, 2, 2);
        }
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(ox, 0, 16, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(ox, 15, 16, 1);
  }

  private drawTile(ctx: CanvasRenderingContext2D, tile: number, ox: number): void {
    const c = TILE_COLORS[tile];
    switch (tile) {
      case Tile.GRASS: {
        this.baseBlock(ctx, ox, Tile.DIRT);
        ctx.fillStyle = c.base;
        ctx.fillRect(ox, 0, 16, 4);
        ctx.fillStyle = c.accent;
        for (let x = 0; x < 16; x += 2) {
          if (hash2D(ox + x, 1, 5) < 0.5) ctx.fillRect(ox + x, 0, 2, 2);
          if (hash2D(ox + x, 4, 5) < 0.4) ctx.fillRect(ox + x, 4, 2, 1);
        }
        break;
      }
      case Tile.WATER: {
        ctx.fillStyle = 'rgba(38, 98, 217, 0.72)';
        ctx.fillRect(ox, 0, 16, 16);
        ctx.fillStyle = 'rgba(95, 150, 255, 0.5)';
        ctx.fillRect(ox, 0, 16, 2);
        ctx.fillRect(ox + 4, 6, 5, 1);
        ctx.fillRect(ox + 10, 11, 4, 1);
        break;
      }
      case Tile.GLASS: {
        ctx.fillStyle = 'rgba(184, 220, 240, 0.45)';
        ctx.fillRect(ox, 0, 16, 16);
        ctx.strokeStyle = 'rgba(143, 188, 216, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(ox + 0.5, 0.5, 15, 15);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(ox + 3, 2, 2, 6);
        ctx.fillRect(ox + 6, 5, 1, 4);
        break;
      }
      case Tile.LEAVES: {
        ctx.fillStyle = 'rgba(63, 143, 46, 0.94)';
        ctx.fillRect(ox, 0, 16, 16);
        for (let y = 0; y < 16; y += 2) {
          for (let x = 0; x < 16; x += 2) {
            const r = hash2D(ox + x, y, 91);
            if (r < 0.2) {
              ctx.fillStyle = '#55ab42';
              ctx.fillRect(ox + x, y, 2, 2);
            } else if (r > 0.9) {
              ctx.clearRect(ox + x, y, 2, 2);
            }
          }
        }
        break;
      }
      case Tile.DOOR: {
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 2, 0, 12, 16);
        ctx.fillStyle = c.dark;
        ctx.fillRect(ox + 2, 0, 12, 1);
        ctx.fillRect(ox + 2, 0, 1, 16);
        ctx.fillRect(ox + 13, 0, 1, 16);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 4, 2, 3, 12);
        ctx.fillRect(ox + 9, 2, 3, 12);
        ctx.fillStyle = '#ffd76a';
        ctx.fillRect(ox + 11, 8, 2, 2);
        break;
      }
      case Tile.TORCH: {
        ctx.fillStyle = c.dark;
        ctx.fillRect(ox + 7, 6, 2, 9);
        ctx.fillStyle = '#ffb02e';
        ctx.fillRect(ox + 6, 2, 4, 5);
        ctx.fillStyle = '#ffd76a';
        ctx.fillRect(ox + 7, 3, 2, 3);
        ctx.fillStyle = 'rgba(255, 176, 46, 0.35)';
        ctx.fillRect(ox + 4, 0, 8, 8);
        break;
      }
      case Tile.ORE_GOLD:
      case Tile.ORE_SILVER:
      case Tile.ORE_COPPER:
      case Tile.ORE_EMERALD: {
        this.baseBlock(ctx, ox, Tile.STONE);
        ctx.fillStyle = c.accent;
        const spots = [
          [3, 3], [9, 2], [12, 7], [5, 8], [2, 12], [9, 12],
        ];
        for (const [sx, sy] of spots) {
          ctx.fillRect(ox + sx, sy, 3, 3);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(ox + sx, sy, 1, 1);
          ctx.fillStyle = c.accent;
        }
        break;
      }
      case Tile.CRYSTAL_BLUE: {
        this.baseBlock(ctx, ox, Tile.DARK_STONE);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 3, 6, 3, 10);
        ctx.fillRect(ox + 7, 3, 3, 13);
        ctx.fillRect(ox + 11, 8, 3, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fillRect(ox + 8, 4, 1, 10);
        ctx.fillRect(ox + 4, 7, 1, 7);
        break;
      }
      case Tile.MOSSY_STONE: {
        this.baseBlock(ctx, ox, Tile.STONE);
        ctx.fillStyle = '#4ec455';
        ctx.fillRect(ox, 0, 16, 3);
        for (let x = 0; x < 16; x += 2) {
          if (hash2D(ox + x, 3, 17) < 0.5) ctx.fillRect(ox + x, 3, 2, 2);
        }
        break;
      }
      case Tile.VINE: {
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 7, 0, 2, 16);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 5, 3, 2, 2);
        ctx.fillRect(ox + 9, 7, 2, 2);
        ctx.fillRect(ox + 5, 11, 2, 2);
        break;
      }
      case Tile.CACTUS: {
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 5, 0, 6, 16);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 6, 0, 2, 16);
        ctx.fillStyle = c.dark;
        ctx.fillRect(ox + 10, 0, 1, 16);
        break;
      }
      case Tile.GRAVESTONE: {
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 4, 4, 8, 12);
        ctx.fillRect(ox + 5, 2, 6, 2);
        ctx.fillStyle = c.dark;
        ctx.fillRect(ox + 6, 6, 4, 1);
        ctx.fillRect(ox + 6, 8, 4, 1);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 4, 4, 1, 12);
        break;
      }
      case Tile.FENCE: {
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 2, 0, 2, 16);
        ctx.fillRect(ox + 12, 0, 2, 16);
        ctx.fillRect(ox, 3, 16, 2);
        ctx.fillRect(ox, 9, 16, 2);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 2, 0, 2, 1);
        ctx.fillRect(ox + 12, 0, 2, 1);
        break;
      }
      case Tile.SIGN: {
        ctx.fillStyle = c.dark;
        ctx.fillRect(ox + 7, 8, 2, 8);
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 1, 1, 14, 8);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 1, 1, 14, 1);
        ctx.fillStyle = '#3c2a18';
        ctx.fillRect(ox + 3, 3, 10, 1);
        ctx.fillRect(ox + 3, 5, 8, 1);
        break;
      }
      case Tile.CHEST: {
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 1, 4, 14, 12);
        ctx.fillStyle = '#6f4826';
        ctx.fillRect(ox + 1, 4, 14, 2);
        ctx.fillStyle = '#c8a84b';
        ctx.fillRect(ox + 1, 8, 14, 2);
        ctx.fillRect(ox + 7, 7, 2, 4);
        ctx.fillStyle = '#ffd76a';
        ctx.fillRect(ox + 7, 8, 2, 2);
        break;
      }
      case Tile.BANNER_RED:
      case Tile.BANNER_BLUE:
      case Tile.BANNER_YELLOW: {
        ctx.fillStyle = '#565660';
        ctx.fillRect(ox, 0, 16, 2);
        ctx.fillStyle = c.base;
        ctx.fillRect(ox + 3, 2, 10, 12);
        ctx.fillStyle = c.accent;
        ctx.fillRect(ox + 5, 4, 6, 2);
        ctx.fillStyle = c.dark;
        ctx.fillRect(ox + 3, 12, 10, 2);
        ctx.fillRect(ox + 5, 14, 6, 1);
        break;
      }
      case Tile.STONE_BRICK:
      case Tile.RED_BRICK:
      case Tile.DARK_STONE:
      case Tile.SANDSTONE: {
        this.baseBlock(ctx, ox, tile);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(ox, 7, 16, 1);
        ctx.fillRect(ox + 4, 0, 1, 8);
        ctx.fillRect(ox + 12, 0, 1, 8);
        ctx.fillRect(ox + 8, 8, 1, 8);
        break;
      }
      case Tile.WOOD: {
        this.baseBlock(ctx, ox, tile);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(ox, 5, 16, 1);
        ctx.fillRect(ox, 11, 16, 1);
        break;
      }
      case Tile.LOG: {
        this.baseBlock(ctx, ox, tile);
        ctx.fillStyle = c.dark;
        ctx.fillRect(ox + 3, 0, 1, 16);
        ctx.fillRect(ox + 11, 0, 1, 16);
        break;
      }
      default:
        this.baseBlock(ctx, ox, tile);
    }
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
      const ox = f * W;
      // hair + head
      ctx.fillStyle = p.hair;
      ctx.fillRect(ox + 4, 0, 8, 3);
      ctx.fillRect(ox + 3, 1, 2, 4);
      ctx.fillStyle = p.skin;
      ctx.fillRect(ox + 5, 3, 7, 5);
      ctx.fillStyle = '#222';
      ctx.fillRect(ox + 10, 4, 1, 2); // eye (faces right)
      // torso + arms
      ctx.fillStyle = p.shirt;
      ctx.fillRect(ox + 4, 8, 8, 7);
      const armSwing = f === 1 ? 1 : f === 3 ? -1 : 0;
      ctx.fillRect(ox + 3 - armSwing, 9, 2, 5);
      ctx.fillRect(ox + 11 + armSwing, 9, 2, 5);
      ctx.fillStyle = p.skin;
      ctx.fillRect(ox + 3 - armSwing, 13, 2, 2);
      ctx.fillRect(ox + 11 + armSwing, 13, 2, 2);
      // legs: 4 frames = idle, step L, pass, step R
      ctx.fillStyle = p.pants;
      const legOff = f === 1 ? 2 : f === 3 ? -2 : 0;
      ctx.fillRect(ox + 5 + Math.min(0, legOff), 15, 3, 8);
      ctx.fillRect(ox + 9 + Math.max(0, legOff), 15, 3, 8);
      // boots
      ctx.fillStyle = '#3c2a18';
      ctx.fillRect(ox + 5 + Math.min(0, legOff), 22, 3, 2);
      ctx.fillRect(ox + 9 + Math.max(0, legOff), 22, 3, 2);
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
    blob(220, 60, 6);
    blob(380, 24, 10);
    this.refresh('clouds');
  }
}
