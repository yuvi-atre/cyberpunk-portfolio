import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

/**
 * Rendering resolution. Phaser's RESIZE mode sizes the canvas in CSS pixels,
 * which a high-DPI display then upscales — pixel art ends up double-blown-up
 * and chunky. Instead the canvas backing store is sized in DEVICE pixels
 * (Scale.NONE + manual resize) and scaled down to CSS size via scale.zoom,
 * and the camera zoom is an integer matched to the DPR so one texel maps to
 * a whole number of device pixels: crisp at native resolution, and tiles
 * render at ~32 CSS px instead of the old ~96.
 */
export const RENDER_DPR = Math.min(3, window.devicePixelRatio || 1);
/** Integer world zoom — texels stay square on the device grid. */
export const GAME_ZOOM = Math.max(1, Math.round(RENDER_DPR));

/**
 * Static Phaser configuration. The canvas mounts into the div owned by
 * PhaserGame.tsx (which drives resize through a ResizeObserver); WebGL is
 * preferred (for Light2D) with automatic Canvas fallback.
 */
export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0a0912',
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 1000 },
        debug: false,
      },
    },
    width: Math.max(1, Math.floor(parent.clientWidth * RENDER_DPR)),
    height: Math.max(1, Math.floor(parent.clientHeight * RENDER_DPR)),
    scale: {
      mode: Phaser.Scale.NONE,
      zoom: 1 / RENDER_DPR, // CSS size = backing size / DPR
    },
    render: {
      maxLights: 64,
    },
    scene: [BootScene, GameScene],
  });
}
