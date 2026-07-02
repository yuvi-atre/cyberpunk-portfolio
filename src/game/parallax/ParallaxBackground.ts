import Phaser from 'phaser';

interface WrapLayer {
  images: Phaser.GameObjects.Image[];
  texWidth: number;
  scrollFactorX: number;
  yOffset: number;
  yFactor: number;
  driftSpeed: number;
  drift: number;
}

/**
 * Infinite parallax built from a minimal set of wrapped images per layer
 * (a manual blitter pattern) instead of full-screen TileSprites, which tank
 * frame rates on low-end GPUs. Coordinates are mathematically wrapped each
 * frame — nothing is created or destroyed while scrolling.
 */
export class ParallaxBackground {
  private sky: Phaser.GameObjects.Image;
  private sun: Phaser.GameObjects.Image;
  private layers: WrapLayer[] = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.sky = scene.add
      .image(0, 0, 'sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0);

    this.sun = scene.add
      .image(0, 0, 'sun')
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(1);

    this.addLayer('clouds', 0.05, 40, 0.02, 2, 4);
    this.addLayer('farridge', 0.08, 90, 0.03, 2, 0);
    this.addLayer('mountains', 0.15, 120, 0.05, 3, 0);
    this.addLayer('hills', 0.35, 230, 0.08, 4, 0);
  }

  private addLayer(
    key: string,
    scrollFactorX: number,
    yOffset: number,
    yFactor: number,
    depth: number,
    driftSpeed: number
  ): void {
    const texWidth = this.scene.textures.get(key).getSourceImage().width;
    // enough images to cover the widest plausible viewport + 1 buffer
    const count = Math.ceil(2560 / texWidth) + 1;
    const images: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < count; i++) {
      images.push(
        this.scene.add
          .image(0, 0, key)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(depth)
      );
    }
    this.layers.push({ images, texWidth, scrollFactorX, yOffset, yFactor, driftSpeed, drift: 0 });
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, surfaceDepthPx: number, delta: number): void {
    // stretch sky to viewport
    this.sky.setDisplaySize(camera.width, camera.height);

    // fade the surface backdrop out as the player descends underground,
    // revealing the dark cave-void background color behind it
    const fade = Phaser.Math.Clamp(1 - surfaceDepthPx / 480, 0, 1);
    this.sky.setAlpha(fade);
    this.sun.setPosition(camera.width - 140, 90).setAlpha(fade);

    for (const layer of this.layers) {
      layer.drift += layer.driftSpeed * (delta / 1000);
      const scroll = camera.scrollX * layer.scrollFactorX + layer.drift;
      const baseX = -Phaser.Math.Wrap(scroll, 0, layer.texWidth);
      const y = layer.yOffset - camera.scrollY * layer.yFactor;
      layer.images.forEach((img, i) => {
        img.setPosition(baseX + i * layer.texWidth, y);
        img.setAlpha(fade);
      });
    }
  }
}
