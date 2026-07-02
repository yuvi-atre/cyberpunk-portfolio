import Phaser from 'phaser';
import { TILE_SIZE } from '../world/Tiles';

/**
 * Ambient security drone: hovers on a sine bob while patrolling a fixed
 * horizontal beat around its spawn point. Pure dressing — no physics body,
 * no interaction — plus a soft red scan light in WebGL.
 */
export class Drone extends Phaser.GameObjects.Sprite {
  private baseY: number;
  private patrolCenterX: number;
  private range = 5 * TILE_SIZE;
  private speed = 0.00035; // patrol cycles per ms
  private light: Phaser.GameObjects.Light | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'drone', 0);
    scene.add.existing(this);
    this.patrolCenterX = x;
    this.baseY = y;
    this.setDepth(18);
    this.play('drone-hover');
    if (scene.game.renderer.type === Phaser.WEBGL) {
      this.setPipeline('Light2D');
      this.light = scene.lights.addLight(x, y + 10, 70, 0xff4b4b, 0.5);
    }
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.light) this.scene.lights.removeLight(this.light);
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const t = time * this.speed;
    this.x = this.patrolCenterX + Math.sin(t) * this.range;
    this.y = this.baseY + Math.sin(time * 0.002) * 6;
    this.setFlipX(Math.cos(t) < 0);
    this.light?.setPosition(this.x, this.y + 12);
  }
}
