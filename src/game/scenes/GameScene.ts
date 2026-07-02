import Phaser from 'phaser';
import { EventBus, GameEvents } from '../EventBus';
import { generateWorld, type GeneratedWorld } from '../world/WorldGenerator';
import { ChunkManager } from '../world/ChunkManager';
import { ORE_TILES, SOLID_TILES, TILE_COLORS, TILE_SIZE, Tile, UNBREAKABLE_TILES } from '../world/Tiles';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { ParallaxBackground } from '../parallax/ParallaxBackground';
import { PortfolioService } from '../../services/PortfolioService';

const MINE_RADIUS_PX = 4.5 * TILE_SIZE;
const INTERACT_RADIUS_PX = 3.5 * TILE_SIZE;

interface Interactable {
  kind: 'npc' | 'sign' | 'project' | 'chest';
  id: string;
  label: string;
  x: number;
  y: number;
  sprite?: NPC;
}

export class GameScene extends Phaser.Scene {
  private world!: GeneratedWorld;
  private chunks!: ChunkManager;
  private player!: Player;
  private npcs: NPC[] = [];
  private interactables: Interactable[] = [];
  private currentHint: Interactable | null = null;
  private modalOpen = false;
  private mineCooldown = 0;
  private pointerHeld = false;
  private scanTimer = 0;
  private depthTimer = 0;
  private useLights = false;

  private onUiInteract = () => this.tryInteract();
  private onModalState = (open: boolean) => (this.modalOpen = open);

  constructor() {
    super('Game');
  }

  create(): void {
    this.useLights = this.game.renderer.type === Phaser.WEBGL;
    this.world = generateWorld();

    const worldW = this.world.width * TILE_SIZE;
    const worldH = this.world.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.parallax = new ParallaxBackground(this);

    // player
    this.player = new Player(
      this,
      this.world.spawn.tx * TILE_SIZE + 8,
      this.world.spawn.ty * TILE_SIZE
    );

    // entities from world markers
    this.spawnFromMarkers();

    // chunk streaming (collides player + NPCs with terrain)
    this.chunks = new ChunkManager(this, this.world, [this.player, ...this.npcs]);

    // camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setZoom(2);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.chunks.update(cam);

    // lighting
    if (this.useLights) {
      this.lights.enable();
      this.lights.setAmbientColor(0xffffff);
      this.lights.addLight(0, 0, 0); // pool warm-up
    }

    // input: mining / placing — held state is tracked via canvas-originated
    // events only (polling activePointer.isDown can read phantom state)
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!p.rightButtonDown()) this.pointerHeld = true;
      this.handlePointer(p);
    });
    this.input.on('pointerup', () => (this.pointerHeld = false));
    this.game.events.on(Phaser.Core.Events.BLUR, () => (this.pointerHeld = false));

    const kb = this.input.keyboard!;
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => this.tryInteract());

    EventBus.on(GameEvents.UI_INTERACT, this.onUiInteract);
    EventBus.on(GameEvents.UI_MODAL_STATE, this.onModalState);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.UI_INTERACT, this.onUiInteract);
      EventBus.off(GameEvents.UI_MODAL_STATE, this.onModalState);
      this.chunks.destroy();
    });

    EventBus.emit(GameEvents.SCENE_READY);
  }

  private parallax!: ParallaxBackground;

  private spawnFromMarkers(): void {
    const npcTextures = ['npc-0', 'npc-1', 'npc-2'];
    let npcIndex = 0;
    for (const m of this.world.markers) {
      const px = m.tx * TILE_SIZE + 8;
      const py = m.ty * TILE_SIZE + 8;
      switch (m.kind) {
        case 'npc': {
          const exp = PortfolioService.experience.find((e) => e.id === m.id);
          if (!exp) break;
          const npc = new NPC(
            this,
            px,
            py - 8,
            npcTextures[npcIndex++ % npcTextures.length],
            exp.npcName
          );
          this.npcs.push(npc);
          this.interactables.push({
            kind: 'npc',
            id: exp.id,
            label: `Talk to ${exp.npcName}`,
            x: px,
            y: py,
            sprite: npc,
          });
          break;
        }
        case 'sign':
          this.interactables.push({ kind: 'sign', id: m.id, label: 'Read sign', x: px, y: py });
          break;
        case 'project': {
          const project = PortfolioService.projectByStructure(m.id);
          if (!project) break;
          this.interactables.push({
            kind: 'project',
            id: m.id,
            label: `View project: ${project.name}`,
            x: px,
            y: py,
          });
          break;
        }
        case 'chest':
          this.interactables.push({ kind: 'chest', id: m.id, label: 'Open treasure chest', x: px, y: py });
          break;
      }
    }
  }

  // ------------------------------------------------------------ interaction
  private nearestInteractable(): Interactable | null {
    let best: Interactable | null = null;
    let bestDist = INTERACT_RADIUS_PX;
    for (const it of this.interactables) {
      const x = it.sprite ? it.sprite.x : it.x;
      const y = it.sprite ? it.sprite.y : it.y;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
      if (d < bestDist) {
        bestDist = d;
        best = it;
      }
    }
    return best;
  }

  private tryInteract(): void {
    if (this.modalOpen) return;
    const it = this.nearestInteractable();
    if (!it) return;
    switch (it.kind) {
      case 'npc': {
        const exp = PortfolioService.experience.find((e) => e.id === it.id);
        if (exp) EventBus.emit(GameEvents.DIALOGUE_OPEN, exp);
        break;
      }
      case 'sign': {
        const sign = PortfolioService.signs.find((s) => s.id === it.id);
        if (sign) EventBus.emit(GameEvents.SIGN_OPEN, sign);
        break;
      }
      case 'project': {
        const project = PortfolioService.projectByStructure(it.id);
        if (project) EventBus.emit(GameEvents.PROJECT_OPEN, project);
        break;
      }
      case 'chest':
        EventBus.emit(GameEvents.CHEST_OPEN);
        break;
    }
  }

  // ----------------------------------------------------------------- mining
  private handlePointer(pointer: Phaser.Input.Pointer): void {
    if (this.modalOpen) return;
    const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    if (pointer.rightButtonDown()) {
      this.placeBlock(world.x, world.y);
    } else {
      this.mineBlock(world.x, world.y);
    }
  }

  private mineBlock(wx: number, wy: number): void {
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, wx, wy) > MINE_RADIUS_PX) return;
    const tx = Math.floor(wx / TILE_SIZE);
    const ty = Math.floor(wy / TILE_SIZE);
    const tile = this.chunks.getTile(tx, ty);
    if (tile === Tile.AIR || tile === Tile.WATER) return;
    if (UNBREAKABLE_TILES.includes(tile)) return;
    // only blocks exposed to air/water (or non-solid dressing) can be broken
    const exposed = [
      this.chunks.getTile(tx - 1, ty),
      this.chunks.getTile(tx + 1, ty),
      this.chunks.getTile(tx, ty - 1),
      this.chunks.getTile(tx, ty + 1),
    ].some((n) => !SOLID_TILES.includes(n));
    if (!exposed) return;

    this.chunks.setTile(tx, ty, Tile.AIR);
    this.burstParticles(tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, tile);

    // ore blocks yield skills from portfolio.json
    if (ORE_TILES.includes(tile)) {
      const key = ty * this.world.width + tx;
      const skillId = this.world.oreMap.get(key);
      if (skillId) {
        this.world.oreMap.delete(key);
        const skill = PortfolioService.skillById(skillId);
        if (skill) EventBus.emit(GameEvents.SKILL_COLLECTED, skill);
      }
    }
  }

  private placeBlock(wx: number, wy: number): void {
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, wx, wy) > MINE_RADIUS_PX) return;
    const tx = Math.floor(wx / TILE_SIZE);
    const ty = Math.floor(wy / TILE_SIZE);
    if (this.chunks.getTile(tx, ty) !== Tile.AIR) return;
    const hasNeighbor = [
      this.chunks.getTile(tx - 1, ty),
      this.chunks.getTile(tx + 1, ty),
      this.chunks.getTile(tx, ty - 1),
      this.chunks.getTile(tx, ty + 1),
    ].some((n) => SOLID_TILES.includes(n));
    if (!hasNeighbor) return;
    // don't entomb the player or an NPC
    const rect = new Phaser.Geom.Rectangle(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    const bodies = [this.player, ...this.npcs];
    if (bodies.some((b) => Phaser.Geom.Rectangle.Overlaps(rect, b.getBounds()))) return;

    this.chunks.setTile(tx, ty, Tile.DIRT);
  }

  /** Temporary burst emitter per break — cheap, and destroyed right after. */
  private burstParticles(x: number, y: number, tile: number): void {
    const color = Phaser.Display.Color.HexStringToColor(
      TILE_COLORS[tile]?.base ?? '#888888'
    ).color;
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: 40, max: 130 },
      angle: { min: 200, max: 340 },
      gravityY: 500,
      lifespan: 450,
      scale: { start: 1, end: 0 },
      tint: color,
      emitting: false,
    });
    emitter.setDepth(30);
    emitter.explode(Phaser.Math.Between(4, 8));
    this.time.delayedCall(600, () => emitter.destroy());
  }

  // ----------------------------------------------------------------- update
  update(_time: number, delta: number): void {
    this.player.updatePlayer(this.chunks);
    this.chunks.update(this.cameras.main);

    const ptx = Phaser.Math.Clamp(Math.floor(this.player.x / TILE_SIZE), 0, this.world.width - 1);
    const surfaceY = this.world.surface[ptx];
    const depthPx = this.player.y - surfaceY * TILE_SIZE;
    this.parallax.update(this.cameras.main, depthPx, delta);

    // ambient light dims with depth (surface = full daylight)
    if (this.useLights) {
      const t = Phaser.Math.Clamp(depthPx / (28 * TILE_SIZE), 0, 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(255, 255, 255),
        new Phaser.Display.Color(40, 40, 58),
        1,
        t
      );
      this.lights.setAmbientColor(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    }

    // drag-mining while pointer held
    this.mineCooldown -= delta;
    if (this.pointerHeld && this.mineCooldown <= 0 && !this.modalOpen) {
      const world = this.input.activePointer.positionToCamera(
        this.cameras.main
      ) as Phaser.Math.Vector2;
      this.mineBlock(world.x, world.y);
      this.mineCooldown = 160;
    }

    // interaction hint scan (throttled)
    this.scanTimer -= delta;
    if (this.scanTimer <= 0) {
      this.scanTimer = 150;
      const nearest = this.modalOpen ? null : this.nearestInteractable();
      if (nearest !== this.currentHint) {
        this.currentHint = nearest;
        EventBus.emit(GameEvents.INTERACT_HINT, nearest ? nearest.label : null);
      }
    }

    // depth telemetry for the HUD
    this.depthTimer -= delta;
    if (this.depthTimer <= 0) {
      this.depthTimer = 300;
      EventBus.emit(GameEvents.PLAYER_DEPTH, Math.max(0, Math.round(depthPx / TILE_SIZE)));
    }
  }
}
