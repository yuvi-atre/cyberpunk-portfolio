import Phaser from 'phaser';
import { TILE_COLORS, TILE_COUNT, TILE_SIZE, Tile } from '../world/Tiles';

// tiles — CraftPix cyberpunk packs (see src/assets/craftpix/ATTRIBUTION.md)
import greenTopUrl from '../../assets/craftpix/tiles/green-top.png';
import greenSoilUrl from '../../assets/craftpix/tiles/green-soil.png';
import greenDeepUrl from '../../assets/craftpix/tiles/green-deep.png';
import metalTopUrl from '../../assets/craftpix/tiles/metal-top.png';
import metalUrl from '../../assets/craftpix/tiles/metal.png';
import metalDarkUrl from '../../assets/craftpix/tiles/metal-dark.png';
import rubbleTopUrl from '../../assets/craftpix/tiles/rubble-top.png';
import rubbleUrl from '../../assets/craftpix/tiles/rubble.png';
import panelUrl from '../../assets/craftpix/tiles/panel.png';
import panelXUrl from '../../assets/craftpix/tiles/panel-x.png';
import windowUrl from '../../assets/craftpix/tiles/window.png';
import shopfrontUrl from '../../assets/craftpix/tiles/shopfront.png';
import shopfrontGlassUrl from '../../assets/craftpix/tiles/shopfront-glass.png';
import awningUrl from '../../assets/craftpix/tiles/awning.png';
import doorUrl from '../../assets/craftpix/tiles/door.png';
import doorTopUrl from '../../assets/craftpix/tiles/door-top.png';
import beamUrl from '../../assets/craftpix/tiles/beam.png';
import girderUrl from '../../assets/craftpix/tiles/girder.png';
import hazardUrl from '../../assets/craftpix/tiles/hazard.png';
import crateUrl from '../../assets/craftpix/tiles/crate.png';
import fenceUrl from '../../assets/craftpix/tiles/fence.png';
import scrapUrl from '../../assets/craftpix/tiles/scrap.png';
import lockerUrl from '../../assets/craftpix/tiles/locker.png';
import boardUrl from '../../assets/craftpix/tiles/board.png';
import wallPanelUrl from '../../assets/craftpix/tiles/wall-panel.png';
import wallRivetUrl from '../../assets/craftpix/tiles/wall-rivet.png';
import wallWindowUrl from '../../assets/craftpix/tiles/wall-window.png';
import wallDarkUrl from '../../assets/craftpix/tiles/wall-dark.png';
import wallGridUrl from '../../assets/craftpix/tiles/wall-grid.png';

// characters (48x48 frames)
import punkIdleUrl from '../../assets/craftpix/player/idle.png';
import punkRunUrl from '../../assets/craftpix/player/run.png';
import punkJumpUrl from '../../assets/craftpix/player/jump.png';
import punkDoubleUrl from '../../assets/craftpix/player/doublejump.png';
import punkFallUrl from '../../assets/craftpix/player/fall.png';
import punkDashUrl from '../../assets/craftpix/player/dash.png';
import punkAttackUrl from '../../assets/craftpix/player/attack.png';
import droneUrl from '../../assets/craftpix/drone/hover-idle.png';

// npc sheets are enumerated by Vite's glob so adding a townsperson is a file drop
const npcSheets = import.meta.glob('../../assets/craftpix/npcs/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

// props & parallax
import cacheSheetUrl from '../../assets/craftpix/props/cache-sheet.png';
import screenSheetUrl from '../../assets/craftpix/props/screen-sheet.png';
import billboardLgUrl from '../../assets/craftpix/props/billboard-lg.png';
import billboardSmUrl from '../../assets/craftpix/props/billboard-sm.png';
import adLg1Url from '../../assets/craftpix/props/ad-lg-1.png';
import adLg2Url from '../../assets/craftpix/props/ad-lg-2.png';
import adSm1Url from '../../assets/craftpix/props/ad-sm-1.png';
import city2Url from '../../assets/craftpix/bg/city-2.png';
import city3Url from '../../assets/craftpix/bg/city-3.png';
import city4Url from '../../assets/craftpix/bg/city-4.png';
import city5Url from '../../assets/craftpix/bg/city-5.png';

/**
 * Loads the CraftPix cyberpunk art and composites the 32x32 tileset strip
 * (1px extruded margin per tile prevents WebGL seam bleeding). Tiles the
 * packs don't cover — holo signs, coolant, data-node glows — are drawn
 * procedurally on top of pack art.
 */

/** Straight one-tile blits: tile id -> loaded texture key. */
const TILE_SOURCES: Partial<Record<Tile, string>> = {
  [Tile.PAVEMENT]: 'tx-green-top',
  [Tile.SOIL]: 'tx-green-soil',
  [Tile.DEEP_SOIL]: 'tx-green-deep',
  [Tile.METAL_TOP]: 'tx-metal-top',
  [Tile.METAL]: 'tx-metal',
  [Tile.METAL_DARK]: 'tx-metal-dark',
  [Tile.RUBBLE_TOP]: 'tx-rubble-top',
  [Tile.RUBBLE]: 'tx-rubble',
  [Tile.PANEL]: 'tx-panel',
  [Tile.PANEL_X]: 'tx-panel-x',
  [Tile.WINDOW]: 'tx-window',
  [Tile.SHOPFRONT]: 'tx-shopfront',
  [Tile.SHOPFRONT_GLASS]: 'tx-shopfront-glass',
  [Tile.AWNING]: 'tx-awning',
  [Tile.DOOR]: 'tx-door',
  [Tile.DOOR_TOP]: 'tx-door-top',
  [Tile.BEAM]: 'tx-beam',
  [Tile.GIRDER]: 'tx-girder',
  [Tile.HAZARD]: 'tx-hazard',
  [Tile.CRATE]: 'tx-crate',
  [Tile.FENCE]: 'tx-fence',
  [Tile.SCRAP]: 'tx-scrap',
  [Tile.LOCKER]: 'tx-locker',
  [Tile.BOARD]: 'tx-board',
  [Tile.WALL_PANEL]: 'tx-wall-panel',
  [Tile.WALL_RIVET]: 'tx-wall-rivet',
  [Tile.WALL_WINDOW]: 'tx-wall-window',
  [Tile.WALL_DARK]: 'tx-wall-dark',
  [Tile.WALL_GRID]: 'tx-wall-grid',
};

const TILE_URLS: Record<string, string> = {
  'tx-green-top': greenTopUrl,
  'tx-green-soil': greenSoilUrl,
  'tx-green-deep': greenDeepUrl,
  'tx-metal-top': metalTopUrl,
  'tx-metal': metalUrl,
  'tx-metal-dark': metalDarkUrl,
  'tx-rubble-top': rubbleTopUrl,
  'tx-rubble': rubbleUrl,
  'tx-panel': panelUrl,
  'tx-panel-x': panelXUrl,
  'tx-window': windowUrl,
  'tx-shopfront': shopfrontUrl,
  'tx-shopfront-glass': shopfrontGlassUrl,
  'tx-awning': awningUrl,
  'tx-door': doorUrl,
  'tx-door-top': doorTopUrl,
  'tx-beam': beamUrl,
  'tx-girder': girderUrl,
  'tx-hazard': hazardUrl,
  'tx-crate': crateUrl,
  'tx-fence': fenceUrl,
  'tx-scrap': scrapUrl,
  'tx-locker': lockerUrl,
  'tx-board': boardUrl,
  'tx-wall-panel': wallPanelUrl,
  'tx-wall-rivet': wallRivetUrl,
  'tx-wall-window': wallWindowUrl,
  'tx-wall-dark': wallDarkUrl,
  'tx-wall-grid': wallGridUrl,
};

export const NPC_TEXTURES: string[] = [];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const [key, url] of Object.entries(TILE_URLS)) this.load.image(key, url);

    const sheet = (key: string, url: string) =>
      this.load.spritesheet(key, url, { frameWidth: 48, frameHeight: 48 });
    sheet('punk-idle', punkIdleUrl);
    sheet('punk-run', punkRunUrl);
    sheet('punk-jump', punkJumpUrl);
    sheet('punk-double', punkDoubleUrl);
    sheet('punk-fall', punkFallUrl);
    sheet('punk-dash', punkDashUrl);
    sheet('punk-attack', punkAttackUrl);
    sheet('drone', droneUrl);

    NPC_TEXTURES.length = 0;
    for (const [path, url] of Object.entries(npcSheets)) {
      const m = path.match(/(t\d+)-(idle|walk)\.png$/);
      if (!m) continue;
      sheet(`${m[1]}-${m[2]}`, url);
      if (m[2] === 'idle') NPC_TEXTURES.push(m[1]);
    }
    NPC_TEXTURES.sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

    this.load.spritesheet('cache', cacheSheetUrl, { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('wall-screen', screenSheetUrl, { frameWidth: 32, frameHeight: 32 });
    this.load.image('billboard-lg', billboardLgUrl);
    this.load.image('billboard-sm', billboardSmUrl);
    this.load.image('ad-lg-1', adLg1Url);
    this.load.image('ad-lg-2', adLg2Url);
    this.load.image('ad-sm-1', adSm1Url);
    this.load.image('city-2', city2Url);
    this.load.image('city-3', city3Url);
    this.load.image('city-4', city4Url);
    this.load.image('city-5', city5Url);
  }

  create(): void {
    this.makeTileset();
    this.makeParticle();
    this.makeSky();
    this.makeAnimations();
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
    const T = TILE_SIZE;
    const STRIDE = T + 2; // 1px extruded margin per side prevents WebGL seam bleeding
    const ctx = this.ctxFor('tiles', TILE_COUNT * STRIDE, STRIDE);
    ctx.imageSmoothingEnabled = false;
    const cellX = (i: number) => i * STRIDE + 1;

    const blit = (srcKey: string, destTile: number, alpha = 1) => {
      const img = this.textures.get(srcKey).getSourceImage() as CanvasImageSource;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, 0, 0, T, T, cellX(destTile), 1, T, T);
      ctx.globalAlpha = 1;
    };

    /** Run a local-coordinate draw function inside a tile cell. */
    const inCell = (tile: number, draw: (c: CanvasRenderingContext2D) => void) => {
      ctx.save();
      ctx.translate(cellX(tile), 1);
      draw(ctx);
      ctx.restore();
    };

    // straight CraftPix tiles
    for (const [tileStr, key] of Object.entries(TILE_SOURCES)) {
      blit(key, Number(tileStr));
    }

    // window panes get a faint interior glow so towers read as inhabited
    inCell(Tile.WINDOW, (c) => {
      c.fillStyle = 'rgba(0, 240, 255, 0.16)';
      c.fillRect(6, 6, T - 12, T - 12);
    });

    // data cache: first frame of the industrial chest animation
    const cacheImg = this.textures.get('cache').getSourceImage() as CanvasImageSource;
    ctx.drawImage(cacheImg, 0, 0, T, T, cellX(Tile.CACHE), 1, T, T);

    // data nodes: metal plate base + glowing nugget clusters per skill color
    const nodes: Array<[Tile, string]> = [
      [Tile.DATA_AMBER, TILE_COLORS[Tile.DATA_AMBER].accent],
      [Tile.DATA_CYAN, TILE_COLORS[Tile.DATA_CYAN].accent],
      [Tile.DATA_MAGENTA, TILE_COLORS[Tile.DATA_MAGENTA].accent],
      [Tile.DATA_GREEN, TILE_COLORS[Tile.DATA_GREEN].accent],
    ];
    for (const [tile, color] of nodes) {
      blit('tx-metal', tile);
      inCell(tile, (c) => this.drawDataNodes(c, color));
    }

    // power cell: dark plate + a bright capsule core
    blit('tx-metal-dark', Tile.POWER_CELL);
    inCell(Tile.POWER_CELL, (c) => {
      c.fillStyle = 'rgba(125, 249, 255, 0.25)';
      c.fillRect(6, 6, 20, 20);
      c.fillStyle = '#7df9ff';
      c.fillRect(11, 9, 10, 14);
      c.fillStyle = '#ffffff';
      c.fillRect(13, 11, 3, 5);
    });

    // fully procedural specials
    inCell(Tile.HOLO_SIGN, (c) => this.drawHoloSign(c));
    inCell(Tile.COOLANT, (c) => this.drawCoolant(c));
    inCell(Tile.NEON_LAMP, (c) => this.drawLamp(c, '#ff2d95', '#ff9ccd'));
    inCell(Tile.LAMP_WHITE, (c) => this.drawLamp(c, '#8fd8ff', '#e8f8ff'));

    // substrate: factory back-panel darkened into an unbreakable shell
    blit('tx-wall-dark', Tile.SUBSTRATE);
    inCell(Tile.SUBSTRATE, (c) => {
      c.fillStyle = 'rgba(6, 5, 12, 0.6)';
      c.fillRect(0, 0, T, T);
    });

    // earthen background walls: darkened terrain fills so tunnels read as
    // depth, never as sky. Factory back-tiles are pre-shaded — dim lightly.
    blit('tx-green-deep', Tile.WALL_SOIL);
    blit('tx-metal', Tile.WALL_METAL);
    for (const wall of [Tile.WALL_SOIL, Tile.WALL_METAL]) {
      inCell(wall, (c) => {
        c.fillStyle = 'rgba(8, 7, 16, 0.58)';
        c.fillRect(0, 0, T, T);
      });
    }
    for (const wall of [
      Tile.WALL_PANEL,
      Tile.WALL_RIVET,
      Tile.WALL_WINDOW,
      Tile.WALL_DARK,
      Tile.WALL_GRID,
    ]) {
      inCell(wall, (c) => {
        c.fillStyle = 'rgba(8, 7, 16, 0.30)';
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

  private drawDataNodes(ctx: CanvasRenderingContext2D, color: string): void {
    const spots = [
      [7, 7], [20, 5], [23, 16], [10, 18], [5, 23], [17, 24],
    ];
    for (const [sx, sy] of spots) {
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy, 5, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillRect(sx + 1, sy + 1, 2, 2);
    }
  }

  /** Street lamp: dark pole with a glowing tube head. */
  private drawLamp(ctx: CanvasRenderingContext2D, glow: string, core: string): void {
    // halo
    ctx.fillStyle = glow;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(4, 0, 24, 14);
    ctx.globalAlpha = 1;
    // lamp head
    ctx.fillStyle = '#2c3554';
    ctx.fillRect(8, 2, 16, 8);
    ctx.fillStyle = glow;
    ctx.fillRect(10, 4, 12, 4);
    ctx.fillStyle = core;
    ctx.fillRect(12, 5, 8, 2);
    // pole and base
    ctx.fillStyle = '#39405a';
    ctx.fillRect(14, 10, 4, 18);
    ctx.fillStyle = '#2c3248';
    ctx.fillRect(10, 28, 12, 4);
  }

  /** Wall-mounted holographic signboard: dark plate, cyan emitter bars. */
  private drawHoloSign(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#141c2c';
    ctx.fillRect(2, 4, 28, 22);
    ctx.strokeStyle = '#2c3a52';
    ctx.lineWidth = 2;
    ctx.strokeRect(3, 5, 26, 20);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.fillRect(5, 7, 22, 16);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(7, 10, 18, 2);
    ctx.fillRect(7, 14, 12, 2);
    ctx.fillRect(7, 18, 15, 2);
    // mount post
    ctx.fillStyle = '#454e68';
    ctx.fillRect(14, 26, 4, 6);
  }

  private drawCoolant(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(14, 111, 111, 0.72)';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = 'rgba(25, 200, 200, 0.5)';
    ctx.fillRect(0, 0, 32, 3);
    ctx.fillStyle = 'rgba(125, 249, 255, 0.25)';
    ctx.fillRect(6, 10, 8, 2);
    ctx.fillRect(20, 20, 6, 2);
  }

  private makeParticle(): void {
    const ctx = this.ctxFor('particle', 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);
    this.refresh('particle');
  }

  /** Night sky gradient with a magenta smog glow at the horizon + moon. */
  private makeSky(): void {
    const ctx = this.ctxFor('sky', 32, 512);
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#1a1d40');
    grad.addColorStop(0.4, '#332a68');
    grad.addColorStop(0.72, '#5c3078');
    grad.addColorStop(1, '#8a3a78');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 512);
    this.refresh('sky');

    const S = 64;
    const mctx = this.ctxFor('moon', S, S);
    const draw = (r: number, color: string) => {
      mctx.fillStyle = color;
      for (let y = -r; y <= r; y += 2) {
        const half = Math.floor(Math.sqrt(r * r - y * y) / 2) * 2;
        mctx.fillRect(S / 2 - half, S / 2 + y, half * 2, 2);
      }
    };
    draw(28, 'rgba(190, 210, 255, 0.16)');
    draw(20, '#cdd8f2');
    draw(15, '#e8eefc');
    // cratered shadow
    mctx.fillStyle = 'rgba(160, 175, 215, 0.5)';
    mctx.fillRect(24, 22, 8, 6);
    mctx.fillRect(36, 34, 6, 4);
    this.refresh('moon');
  }

  // -------------------------------------------------------------- animations
  private makeAnimations(): void {
    const all = (key: string) => this.anims.generateFrameNumbers(key, {});

    this.anims.create({ key: 'p-idle', frames: all('punk-idle'), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'p-run', frames: all('punk-run'), frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'p-jump', frames: all('punk-jump'), frameRate: 10 });
    this.anims.create({ key: 'p-double', frames: all('punk-double'), frameRate: 14 });
    this.anims.create({ key: 'p-fall', frames: all('punk-fall'), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'p-dash', frames: all('punk-dash'), frameRate: 20 });
    this.anims.create({ key: 'p-attack', frames: all('punk-attack'), frameRate: 16 });
    this.anims.create({ key: 'drone-hover', frames: all('drone'), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'screen-flicker', frames: all('wall-screen'), frameRate: 5, repeat: -1 });

    for (const t of NPC_TEXTURES) {
      this.anims.create({ key: `${t}-idle`, frames: all(`${t}-idle`), frameRate: 6, repeat: -1 });
      this.anims.create({ key: `${t}-walk`, frames: all(`${t}-walk`), frameRate: 10, repeat: -1 });
    }
  }
}
