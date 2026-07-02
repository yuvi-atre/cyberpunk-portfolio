import Phaser from 'phaser';
import { TILE_SIZE } from '../world/Tiles';

/**
 * Wandering townsperson using a bounded random walk: pick a direction,
 * stroll for a beat, idle, repeat — never leaving its home range. Named
 * NPCs represent colleagues from portfolio.json; unnamed ones are ambient
 * crowd. Textures come from the CraftPix townspeople pack (48x48 frames,
 * keys like "t3" with `-idle` / `-walk` animations registered at boot).
 */
export class NPC extends Phaser.Physics.Arcade.Sprite {
  private minX: number;
  private maxX: number;
  private walkDir = 0;
  private nextDecision = 0;
  private label: Phaser.GameObjects.Text | null = null;
  private textureKeyBase: string;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, name?: string) {
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

    this.minX = x - 4 * TILE_SIZE;
    this.maxX = x + 4 * TILE_SIZE;

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

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.activated) {
      this.anims.play(`${this.textureKeyBase}-idle`, true);
      return;
    }

    if (time > this.nextDecision) {
      this.walkDir = Phaser.Math.Between(-1, 1);
      this.nextDecision = time + Phaser.Math.Between(1200, 3200);
    }
    if (this.x < this.minX) this.walkDir = 1;
    if (this.x > this.maxX) this.walkDir = -1;

    this.setVelocityX(this.walkDir * 40);
    if (this.walkDir !== 0) {
      this.setFlipX(this.walkDir < 0);
      this.anims.play(`${this.textureKeyBase}-walk`, true);
    } else {
      this.anims.play(`${this.textureKeyBase}-idle`, true);
    }

    this.label?.setPosition(this.x, this.y - 26);
  }
}
