import Phaser from 'phaser';

interface WrapLayer {
  images: Phaser.GameObjects.Image[];
  texWidth: number;
  scrollFactorX: number;
  yFactor: number;
  drift: number;
  driftSpeed: number;
}

const LAYER_DEFS = [
  // CraftPix scrolling-city silhouettes, tinted from haze-violet to deep indigo
  { key: 'city-2', scrollFactorX: 0.06, tint: 0xb2a2e2, driftSpeed: 0 },
  { key: 'city-3', scrollFactorX: 0.13, tint: 0x8878c4, driftSpeed: 0 },
  { key: 'city-4', scrollFactorX: 0.24, tint: 0x5c5298, driftSpeed: 0 },
  { key: 'city-5', scrollFactorX: 0.42, tint: 0x363064, driftSpeed: 0 },
];

/**
 * Infinite parallax built from a minimal set of wrapped images per layer
 * (a manual blitter pattern) instead of full-screen TileSprites, which tank
 * frame rates on low-end GPUs. Coordinates are mathematically wrapped each
 * frame — nothing is created or destroyed while scrolling.
 *
 * The skyline layers are grey silhouettes from the CraftPix night set,
 * tinted progressively darker violet to sit against the neon-smog sky.
 */
export class ParallaxBackground {
  private sky: Phaser.GameObjects.Image;
  private moon: Phaser.GameObjects.Image;
  private layers: WrapLayer[] = [];
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.sky = scene.add
      .image(0, 0, 'sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0);

    this.moon = scene.add
      .image(0, 0, 'moon')
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(1);

    LAYER_DEFS.forEach((def, i) => this.addLayer(def, i + 2));
  }

  private addLayer(def: (typeof LAYER_DEFS)[number], depth: number): void {
    const texWidth = this.scene.textures.get(def.key).getSourceImage().width;
    // enough images to cover the widest plausible viewport + 1 buffer
    const count = Math.ceil(2560 / texWidth) + 1;
    const images: Phaser.GameObjects.Image[] = [];
    for (let i = 0; i < count; i++) {
      // tintFill flattens the grey art into a solid silhouette color, so each
      // layer reads as a clean depth plane against the smog-glow sky
      images.push(
        this.scene.add
          .image(0, 0, def.key)
          .setOrigin(0, 1)
          .setScrollFactor(0)
          .setDepth(depth)
          .setTintFill(def.tint)
      );
    }
    this.layers.push({
      images,
      texWidth,
      scrollFactorX: def.scrollFactorX,
      yFactor: 0.02 + depth * 0.012,
      drift: 0,
      driftSpeed: def.driftSpeed,
    });
  }

  private refScrollY: number | null = null;

  update(camera: Phaser.Cameras.Scene2D.Camera, surfaceDepthPx: number, delta: number): void {
    // stretch sky to viewport
    this.sky.setDisplaySize(camera.width, camera.height);

    // fade the skyline out as the player descends into the undercity,
    // revealing the dark void color behind it
    const fade = Phaser.Math.Clamp(1 - surfaceDepthPx / 480, 0, 1);
    this.sky.setAlpha(fade);
    this.moon.setPosition(camera.width - 150, 80).setAlpha(fade * 0.9);

    // moderate scale: silhouettes rise from the horizon, not fill the screen
    const scale = Math.max(1.25, camera.height / 500);
    if (this.refScrollY === null) this.refScrollY = camera.scrollY;

    for (const layer of this.layers) {
      layer.drift += layer.driftSpeed * (delta / 1000);
      const w = layer.texWidth * scale;
      const scroll = camera.scrollX * layer.scrollFactorX + layer.drift;
      const baseX = -Phaser.Math.Wrap(scroll, 0, w);
      // silhouette bases sit just below the street horizon (terrain covers
      // the overlap) and ease vertically at a fraction of camera movement
      const y =
        camera.height * 0.68 - (camera.scrollY - this.refScrollY) * layer.yFactor;
      layer.images.forEach((img, i) => {
        img.setScale(scale);
        img.setPosition(baseX + i * w, y);
        img.setAlpha(fade);
      });
    }
  }
}
