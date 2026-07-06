import { useEffect, useRef } from 'react';
import type Phaser from 'phaser';
import { createGame, RENDER_DPR } from './game/main';

/**
 * Engine initialization bridge. React owns the mounting/unmounting of the
 * container div; Phaser owns every pixel inside it. The canvas backing store
 * is sized in device pixels (see game/main.ts), so this component forwards
 * container resizes manually — Scale.NONE means Phaser won't do it itself.
 * The instance is destroyed on unmount to prevent WebGL context leaks.
 */
export function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!gameRef.current) {
      gameRef.current = createGame(el);
      // debug handle for console inspection
      (window as unknown as { __game?: Phaser.Game }).__game = gameRef.current;
    }
    const ro = new ResizeObserver(() => {
      gameRef.current?.scale.resize(
        Math.max(1, Math.floor(el.clientWidth * RENDER_DPR)),
        Math.max(1, Math.floor(el.clientHeight * RENDER_DPR))
      );
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} id="phaser-container" className="absolute inset-0 z-0" />;
}
