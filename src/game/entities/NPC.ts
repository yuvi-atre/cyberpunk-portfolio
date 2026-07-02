import Phaser from 'phaser';
import { TILE_SIZE } from '../world/Tiles';

/**
 * Wandering NPC using a bounded random walk: pick a direction, stroll for a
 * beat, idle, repeat — never leaving its home range. Represents a colleague
 * or reference from portfolio.json.
 */
export class NPC extends Phaser.Physics.Arcade.Sprite {
  private minX: number;
  private maxX: number;
  private walkDir = 0;
  private nextDecision = 0;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, name: string) {
    super(scene, x, y, texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setSize(10, 22).setOffset(3, 2);
    this.setDepth(19);
    if (scene.game.renderer.type === Phaser.WEBGL) this.setPipeline('Light2D');

    this.minX = x - 4 * TILE_SIZE;
    this.maxX = x + 4 * TILE_SIZE;

    this.label = scene.add
      .text(x, y - 20, name, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        color: '#f2ead8',
        stroke: '#1a1626',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(25)
      .setResolution(3);

    if (!scene.anims.exists(`${texture}-walk`)) {
      scene.anims.create({
        key: `${texture}-walk`,
        frames: [1, 2, 3, 2].map((f) => ({ key: texture, frame: f })),
        frameRate: 6,
        repeat: -1,
      });
      scene.anims.create({ key: `${texture}-idle`, frames: [{ key: texture, frame: 0 }] });
    }

    this.once(Phaser.GameObjects.Events.DESTROY, () => this.label.destroy());
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (time > this.nextDecision) {
      this.walkDir = Phaser.Math.Between(-1, 1);
      this.nextDecision = time + Phaser.Math.Between(1200, 3200);
    }
    if (this.x < this.minX) this.walkDir = 1;
    if (this.x > this.maxX) this.walkDir = -1;

    this.setVelocityX(this.walkDir * 35);
    if (this.walkDir !== 0) {
      this.setFlipX(this.walkDir < 0);
      this.anims.play(`${this.texture.key}-walk`, true);
    } else {
      this.anims.play(`${this.texture.key}-idle`, true);
    }

    this.label.setPosition(this.x, this.y - 14);
  }
}
