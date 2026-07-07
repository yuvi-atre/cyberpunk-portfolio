import Phaser from 'phaser';
import { EventBus, GameEvents } from '../EventBus';
import { buildCityMap, SURFACE_Y, type CityWorld, type WorldMarker } from '../world/CityMap';
import { ChunkManager } from '../world/ChunkManager';
import { SHARD_COLORS, TILE_SIZE } from '../world/Tiles';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { Drone } from '../entities/Drone';
import { ParallaxBackground } from '../parallax/ParallaxBackground';
import { PortfolioService } from '../../services/PortfolioService';
import { NPC_TEXTURES } from './BootScene';
import { GAME_ZOOM } from '../main';

const INTERACT_RADIUS_PX = 3 * TILE_SIZE;
const BULLET_LIFE_MS = 900;
const SHARD_TOUCH_RADIUS = 26;
const SHARD_SHOT_RADIUS = 20;

interface Interactable {
  kind: 'npc' | 'sign' | 'project' | 'chest' | 'elevator';
  id: string;
  label: string;
  x: number;
  y: number;
  sprite?: NPC;
}

interface Shard {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
  light: Phaser.GameObjects.Light | null;
  color: number;
}

/**
 * The city scene. A small hand-authored map: the player walks a guided
 * street, talks to NPCs, rides the tower elevator, and shoots floating data
 * shards to collect skills. There is no terrain mutation of any kind.
 */
export class GameScene extends Phaser.Scene {
  private world!: CityWorld;
  private chunks!: ChunkManager;
  private player!: Player;
  private bullets!: Phaser.Physics.Arcade.Group;
  private npcs: NPC[] = [];
  private shards: Shard[] = [];
  private interactables: Interactable[] = [];
  private elevators = new Map<string, Array<{ x: number; y: number }>>();
  private currentHint: Interactable | null = null;
  private modalOpen = false;
  private riding = false;
  private scanTimer = 0;
  private useLights = false;
  private parallax!: ParallaxBackground;

  private onUiInteract = () => this.tryInteract();
  private onModalState = (open: boolean) => (this.modalOpen = open);
  private onRecruiterState = (open: boolean) => {
    this.modalOpen = open;
    if (open) this.scene.pause();
    else this.scene.resume();
  };

  constructor() {
    super('Game');
  }

  create(): void {
    this.useLights = this.game.renderer.type === Phaser.WEBGL;
    this.world = buildCityMap();
    this.npcs = [];
    this.shards = [];
    this.interactables = [];
    this.elevators.clear();

    const worldW = this.world.width * TILE_SIZE;
    const worldH = this.world.height * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    this.parallax = new ParallaxBackground(this);

    // bullet pool — recycled sprites, gravity-free, collide with terrain
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 16,
      allowGravity: false,
    });

    this.player = new Player(
      this,
      this.world.spawn.tx * TILE_SIZE + 16,
      this.world.spawn.ty * TILE_SIZE,
      this.bullets
    );

    this.spawnFromMarkers();

    // chunk streaming (collides player, NPCs and bullets with terrain)
    this.chunks = new ChunkManager(this, this.world, [
      this.player,
      ...this.npcs,
      this.bullets,
    ]);

    const cam = this.cameras.main;
    // clamp the view a few rows below street level so the frame stays on
    // the city, not the solid ground fill
    cam.setBounds(0, 0, worldW, (SURFACE_Y + 7) * TILE_SIZE);
    // integer zoom matched to the display DPR — one texel = whole device
    // pixels, so tiles read at native ~32 CSS px like the source art
    cam.setZoom(GAME_ZOOM);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.chunks.update(cam);

    // lighting — perpetual neon night
    if (this.useLights) {
      this.lights.enable();
      this.lights.setAmbientColor(0xaab2d8);
    }

    // input: click shoots, E interacts
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.modalOpen) return;
      const world = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.player.shootAt(world.x, world.y);
    });
    const kb = this.input.keyboard!;
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.E).on('down', () => this.tryInteract());

    EventBus.on(GameEvents.UI_INTERACT, this.onUiInteract);
    EventBus.on(GameEvents.UI_MODAL_STATE, this.onModalState);
    EventBus.on(GameEvents.UI_RECRUITER_STATE, this.onRecruiterState);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(GameEvents.UI_INTERACT, this.onUiInteract);
      EventBus.off(GameEvents.UI_MODAL_STATE, this.onModalState);
      EventBus.off(GameEvents.UI_RECRUITER_STATE, this.onRecruiterState);
      this.chunks.destroy();
    });

    EventBus.emit(GameEvents.SCENE_READY);

    // dev-only handle for manual testing (teleport, state inspection)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__gameScene = this;
    }
  }

  /** Dev helper: drop the player at a tile column's street level. */
  teleport(tx: number): void {
    this.player.setPosition(tx * TILE_SIZE + 16, (SURFACE_Y - 3) * TILE_SIZE);
    this.player.setVelocity(0, 0);
  }

  // ------------------------------------------------------------------ spawn
  private spawnFromMarkers(): void {
    // named NPCs cycle through a fixed texture order so casting is stable
    const namedTextures = NPC_TEXTURES.length ? NPC_TEXTURES : ['t1'];
    let npcIndex = 0;
    let walkerIndex = 3; // offset so crowd walkers don't mirror the named cast
    for (const m of this.world.markers) {
      const px = m.tx * TILE_SIZE + 16;
      const py = m.ty * TILE_SIZE + 16;
      switch (m.kind) {
        case 'npc': {
          const exp = PortfolioService.experience.find((e) => e.id === m.id);
          if (!exp) break;
          const npc = new NPC(
            this,
            px,
            py - 16,
            namedTextures[npcIndex++ % namedTextures.length],
            exp.npcName,
            2
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
        case 'walker': {
          // ambient pedestrians — pure crowd dressing, not interactable
          const npc = new NPC(
            this,
            px,
            py - 16,
            namedTextures[walkerIndex++ % namedTextures.length],
            undefined,
            4
          );
          this.npcs.push(npc);
          break;
        }
        case 'drone':
          new Drone(this, px, py);
          break;
        case 'billboard':
          this.placeBillboard(m.id, px, py + 16);
          break;
        case 'sign':
          this.interactables.push({ kind: 'sign', id: m.id, label: 'Read holo-sign', x: px, y: py });
          break;
        case 'project': {
          const project = PortfolioService.projectByStructure(m.id);
          if (!project) break;
          this.placeMonument(px, m.ty * TILE_SIZE + TILE_SIZE);
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
          this.interactables.push({ kind: 'chest', id: m.id, label: 'Access data cache', x: px, y: py });
          break;
        case 'shard': {
          // tint index follows the skills array so the inventory swatches match
          const idx = PortfolioService.skills.findIndex((s) => s.id === m.id);
          this.placeShard(m, px, py, Math.max(0, idx));
          break;
        }
        case 'elevator': {
          const stops = this.elevators.get(m.id) ?? [];
          stops.push({ x: px, y: py });
          this.elevators.set(m.id, stops);
          this.interactables.push({
            kind: 'elevator',
            id: m.id,
            label: 'Take the elevator',
            x: px,
            y: py,
          });
          break;
        }
      }
    }
  }

  /**
   * Street advertising, dispatched on the marker id:
   *   "poster-NN" — a flat paper ad pasted straight onto the wall
   *   "sq-NN"     — square wall billboard frame + glowing ad face NN
   *   "lg-N"/"sm-N" — the classic framed billboards
   * Ad faces stay unlit so they glow against the night.
   */
  private placeBillboard(id: string, px: number, py: number): void {
    if (id.startsWith('poster-')) {
      const poster = this.add.image(px, py, id).setOrigin(0.5, 1).setDepth(11);
      if (this.useLights) poster.setPipeline('Light2D');
      return;
    }
    if (id.startsWith('sq-')) {
      const frame = this.add.image(px, py, 'billboard-sq').setOrigin(0.5, 1).setDepth(12);
      if (this.useLights) {
        frame.setPipeline('Light2D');
        this.lights.addLight(px, py - 35, 130, 0x6bd7ff, 0.5);
      }
      this.add.image(px, py - 3, `adsq-${id.slice(3)}`).setOrigin(0.5, 1).setDepth(13);
      return;
    }
    const size = id.startsWith('lg') ? 'lg' : 'sm';
    const frame = this.add
      .image(px, py, `billboard-${size}`)
      .setOrigin(0.5, 1)
      .setDepth(12);
    if (this.useLights) {
      frame.setPipeline('Light2D');
      this.lights.addLight(px, py - 30, 150, 0x6bd7ff, 0.55);
    }
    this.add
      .image(px, py - (size === 'lg' ? 24 : 26), `ad-${id}`)
      .setOrigin(0.5, 1)
      .setDepth(13);
  }

  /** Project monument: a flickering wall screen on the ground + cyan glow. */
  private placeMonument(px: number, groundY: number): void {
    this.add
      .sprite(px, groundY, 'wall-screen')
      .setOrigin(0.5, 1)
      .setDepth(12)
      .play('screen-flicker');
    if (this.useLights) this.lights.addLight(px, groundY - 20, 140, 0x00f0ff, 0.8);
  }

  /** Floating skill shard, bobbing on a tween, shot or touched to collect. */
  private placeShard(m: WorldMarker, px: number, py: number, index: number): void {
    const color = Phaser.Display.Color.HexStringToColor(
      SHARD_COLORS[index % SHARD_COLORS.length]
    ).color;
    const sprite = this.add.sprite(px, py, 'shard').setDepth(15).setTint(color);
    this.tweens.add({
      targets: sprite,
      y: py - 6,
      duration: 900 + (index % 3) * 140,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    const light = this.useLights ? this.lights.addLight(px, py, 110, color, 0.9) : null;
    this.shards.push({ id: m.id, sprite, light, color });
  }

  private collectShard(shard: Shard): void {
    this.shards = this.shards.filter((s) => s !== shard);
    this.burstParticles(shard.sprite.x, shard.sprite.y, shard.color);
    shard.sprite.destroy();
    if (shard.light) this.lights.removeLight(shard.light);
    const skill = PortfolioService.skillById(shard.id);
    if (skill) EventBus.emit(GameEvents.SKILL_COLLECTED, skill);
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
    if (this.modalOpen || this.riding) return;
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
      case 'elevator':
        this.rideElevator(it);
        break;
    }
  }

  /** Elevator: fade out, move to the paired stop, fade back in. */
  private rideElevator(it: Interactable): void {
    const stops = this.elevators.get(it.id) ?? [];
    if (stops.length < 2) return;
    const nearest = stops.reduce((a, b) =>
      Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) <
      Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y)
        ? a
        : b
    );
    const target = stops.find((s) => s !== nearest);
    if (!target) return;

    this.riding = true;
    const cam = this.cameras.main;
    cam.fadeOut(220, 10, 9, 18);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.setPosition(target.x, target.y - 8);
      this.player.setVelocity(0, 0);
      this.chunks.update(cam);
      cam.fadeIn(260, 10, 9, 18);
      this.riding = false;
    });
  }

  // ------------------------------------------------------------------ fx
  /** Temporary burst emitter — cheap, destroyed right after. */
  private burstParticles(x: number, y: number, tint: number): void {
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: 40, max: 130 },
      angle: { min: 0, max: 360 },
      gravityY: 300,
      lifespan: 450,
      scale: { start: 1, end: 0 },
      tint,
      emitting: false,
    });
    emitter.setDepth(30);
    emitter.explode(Phaser.Math.Between(6, 10));
    this.time.delayedCall(600, () => emitter.destroy());
  }

  /** Retire bullets on wall hits / timeout; collect shards they pass. */
  private sweepBullets(): void {
    const now = this.time.now;
    for (const obj of this.bullets.getMatching('active', true)) {
      const bullet = obj as Phaser.Physics.Arcade.Sprite;
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      const hitWall =
        body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down;
      const expired = now - ((bullet.getData('bornAt') as number) ?? now) > BULLET_LIFE_MS;

      let hitShard: Shard | null = null;
      for (const shard of this.shards) {
        if (
          Phaser.Math.Distance.Between(bullet.x, bullet.y, shard.sprite.x, shard.sprite.y) <
          SHARD_SHOT_RADIUS
        ) {
          hitShard = shard;
          break;
        }
      }

      if (hitShard) this.collectShard(hitShard);
      if (hitWall) this.burstParticles(bullet.x, bullet.y, 0x7df9ff);
      if (hitWall || expired || hitShard) {
        bullet.disableBody(true, true);
      }
    }
  }

  // ----------------------------------------------------------------- update
  update(_time: number, delta: number): void {
    this.player.updatePlayer();
    this.chunks.update(this.cameras.main);
    this.sweepBullets();

    // wake NPC physics once their terrain is streamed in (camera view + margin)
    const view = this.cameras.main.worldView;
    for (const npc of this.npcs) {
      if (!npc.activated && view.contains(npc.x, npc.y)) npc.activate();
    }

    // walking through a shard collects it too (touch devices, no-aim path)
    for (const shard of this.shards) {
      if (
        Phaser.Math.Distance.Between(this.player.x, this.player.y, shard.sprite.x, shard.sprite.y) <
        SHARD_TOUCH_RADIUS
      ) {
        this.collectShard(shard);
        break;
      }
    }

    this.parallax.update(this.cameras.main, 0, delta);

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
  }
}
