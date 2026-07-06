import Phaser from 'phaser';
import { TILE_SIZE } from '../world/Tiles';

/**
 * Townsperson on a bounded ping-pong patrol. The map author guarantees the
 * ground is flat for the whole patrol span, so the walk can never wedge an
 * NPC into terrain; hitting a wall (or the span edge) simply turns them
 * around, and short idle pauses at the turn points keep it lifelike.
 * Named NPCs represent colleagues from portfolio.json; unnamed ones are
 * ambient crowd. Textures come from the CraftPix townspeople pack.
 */
const WALK_SPEED = 38;
const PAUSE_MS: [number, number] = [900, 2200];

export class NPC extends Phaser.Physics.Arcade.Sprite {
  private minX: number;
  private maxX: number;
  private walkDir: -1 | 1 = 1;
  private pausedUntil = 0;
  private label: Phaser.GameObjects.Text | null = null;
  private textureKeyBase: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    name?: string,
    patrolTiles = 3
  ) {
    super(scene, x, y, `${texture}-idle`, 0);
    this.textureKeyBase = texture;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(14, 30).setOffset(17, 18);
    // physics stays frozen until the camera approaches — distant NPCs have
    // no streamed-in terrain chunks yet and would fall through the world
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.setDepth(19);
    if (scene.game.renderer.type === Phaser.WEBGL) this.setPipeline('Light2D');

    this.minX = x - patrolTiles * TILE_SIZE;
    this.maxX = x + patrolTiles * TILE_SIZE;
    this.walkDir = Math.random() < 0.5 ? -1 : 1;

    if (name) {
      this.label = scene.add
        .text(x, y - 30, name, {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          color: '#c7f7ff',
          stroke: '#10121f',
          strokeThickness: 3,
        })
        .setOrigin(0.5, 1)
        .setDepth(25)
        .setResolution(3);
    }

    this.once(Phaser.GameObjects.Events.DESTROY, () => this.label?.destroy());
  }

  /** Wake physics once terrain around this NPC is guaranteed streamed in. */
  activate(): void {
    (this.body as Phaser.Physics.Arcade.Body).enable = true;
  }

  get activated(): boolean {
    return (this.body as Phaser.Physics.Arcade.Body).enable;
  }

  private turn(time: number): void {
    this.walkDir = this.walkDir === 1 ? -1 : 1;
    this.pausedUntil = time + Phaser.Math.Between(PAUSE_MS[0], PAUSE_MS[1]);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.activated) {
      this.anims.play(`${this.textureKeyBase}-idle`, true);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (time < this.pausedUntil) {
      this.setVelocityX(0);
      this.anims.play(`${this.textureKeyBase}-idle`, true);
    } else {
      // turn at the patrol edges or when a wall blocks the way
      if (
        (this.walkDir === 1 && (this.x >= this.maxX || body.blocked.right)) ||
        (this.walkDir === -1 && (this.x <= this.minX || body.blocked.left))
      ) {
        this.turn(time);
        this.setVelocityX(0);
      } else {
        this.setVelocityX(this.walkDir * WALK_SPEED);
        this.setFlipX(this.walkDir < 0);
        this.anims.play(`${this.textureKeyBase}-walk`, true);
      }
    }

    this.label?.setPosition(this.x, this.y - 26);
  }
}
