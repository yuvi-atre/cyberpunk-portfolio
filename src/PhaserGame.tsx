import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame } from './game/main';

/**
 * Engine initialization bridge. React owns the mounting/unmounting of the
 * container div; Phaser owns every pixel inside it. The instance is
 * destroyed on unmount to prevent WebGL context and listener leaks.
 */
export function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = createGame('phaser-container');
      // debug handle for console inspection
      (window as unknown as { __game?: Phaser.Game }).__game = gameRef.current;
    }
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="phaser-container" className="absolute inset-0 z-0" />;
}
