import type { Personal } from '../services/PortfolioService';

interface Props {
  personal: Personal;
  hint: string | null;
  depth: number;
  discovered: number;
  totalSkills: number;
  isTouch: boolean;
  onOpenAbout: () => void;
  onOpenInventory: () => void;
}

/** Always-on overlay chrome. The container ignores pointer events; only buttons capture them. */
export function HUD({
  personal,
  hint,
  depth,
  discovered,
  totalSkills,
  isTouch,
  onOpenAbout,
  onOpenInventory,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* top-left identity */}
      <div className="pixel-panel absolute left-3 top-3 px-4 py-3">
        <div className="font-display text-[10px] md:text-xs" style={{ color: 'var(--text-accent)' }}>
          {personal.name}
        </div>
        <div className="font-body mt-1 text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
          {personal.title}
        </div>
      </div>

      {/* top-right actions */}
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-wrap justify-end gap-2">
        <button className="pixel-btn" onClick={onOpenAbout}>
          ABOUT
        </button>
        <button className="pixel-btn" onClick={onOpenInventory}>
          SKILLS {discovered}/{totalSkills}
        </button>
        <a className="pixel-btn" href={personal.github} target="_blank" rel="noreferrer">
          GITHUB
        </a>
        <a className="pixel-btn" href={`mailto:${personal.contact}`}>
          CONTACT
        </a>
      </div>

      {/* bottom-left depth meter */}
      {depth > 2 && (
        <div className="pixel-panel absolute bottom-3 left-3 px-3 py-2">
          <span className="font-display text-[10px]" style={{ color: 'var(--info)' }}>
            ⛏ DEPTH {depth}m
          </span>
        </div>
      )}

      {/* bottom-center interaction hint */}
      {hint && (
        <div
          className="pixel-panel absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2"
          style={{ borderColor: 'var(--border-accent)' }}
        >
          <span className="font-display text-[10px] md:text-xs" style={{ color: 'var(--text-accent)' }}>
            {isTouch ? 'TAP ✦ — ' : '[E] — '}
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}
