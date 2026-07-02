import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';

/**
 * Static Phaser configuration. The canvas mounts into the div owned by
 * PhaserGame.tsx and resizes with it; WebGL is preferred (for Light2D)
 * with automatic Canvas fallback.
 */
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  backgroundColor: '#0b0a14',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  render: {
    maxLights: 64,
  },
  scene: [BootScene, GameScene],
};

export function createGame(parent: string): Phaser.Game {
  return new Phaser.Game({ ...gameConfig, parent });
}
