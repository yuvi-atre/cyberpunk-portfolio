import { EventBus, GameEvents } from '../game/EventBus';

/**
 * Touch input overlay. Buttons synthesize input events over the EventBus;
 * the Phaser player controller consumes them identically to keyboard input.
 */
export function MobileControls() {
  const move = (dir: -1 | 0 | 1) => EventBus.emit(GameEvents.UI_MOVE, dir);
  const jump = (down: boolean) => EventBus.emit(GameEvents.UI_JUMP, down);
  const shoot = () => EventBus.emit(GameEvents.UI_SHOOT);
  const interact = () => EventBus.emit(GameEvents.UI_INTERACT);

  const hold = (start: () => void, end: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      start();
    },
    onPointerUp: end,
    onPointerLeave: end,
    onPointerCancel: end,
  });

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-4">
      <div className="pointer-events-auto flex gap-3">
        <button className="touch-btn" {...hold(() => move(-1), () => move(0))} aria-label="Move left">
          ◀
        </button>
        <button className="touch-btn" {...hold(() => move(1), () => move(0))} aria-label="Move right">
          ▶
        </button>
      </div>
      <div className="pointer-events-auto flex gap-3">
        <button className="touch-btn" onPointerDown={interact} aria-label="Interact">
          ✦
        </button>
        <button className="touch-btn" onPointerDown={shoot} aria-label="Shoot">
          ◎
        </button>
        <button className="touch-btn" {...hold(() => jump(true), () => jump(false))} aria-label="Jump">
          ▲
        </button>
      </div>
    </div>
  );
}
