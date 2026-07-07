import type { Personal } from '../services/PortfolioService';

interface Props {
  personal: Personal;
  hint: string | null;
  discovered: number;
  totalSkills: number;
  isTouch: boolean;
  onOpenAbout: () => void;
  onOpenInventory: () => void;
  onOpenRecruiter: () => void;
}

/** Always-on overlay chrome. The container ignores pointer events; only buttons capture them. */
export function HUD({
  personal,
  hint,
  discovered,
  totalSkills,
  isTouch,
  onOpenAbout,
  onOpenInventory,
  onOpenRecruiter,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* top-left identity — capped width so it never collides with the
          button row, which is inset to start at 240px */}
      <div className="pixel-panel absolute left-3 top-3 max-w-[210px] px-4 py-3">
        <div className="font-display text-[10px] md:text-xs" style={{ color: 'var(--neon-pink)' }}>
          {personal.name}
        </div>
        <div className="font-body mt-1 text-base md:text-lg" style={{ color: 'var(--text-secondary)' }}>
          {personal.title}
        </div>
      </div>

      {/* top-right actions — left inset keeps the row clear of the identity panel */}
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-wrap justify-end gap-2" style={{ left: 240 }}>
        <button className="pixel-btn pixel-btn-accent" onClick={onOpenRecruiter}>
          ★ RECRUITER MODE
        </button>
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

      {/* bottom-center interaction hint */}
      {hint && (
        <div
          className="pixel-panel absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2"
          style={{ borderColor: 'var(--neon-pink)' }}
        >
          <span className="font-display text-[10px] md:text-xs" style={{ color: 'var(--neon-pink)' }}>
            {isTouch ? 'TAP ✦ — ' : '[E] — '}
            {hint}
          </span>
        </div>
      )}
    </div>
  );
}
