import { Modal } from './Modal';
import { PortfolioService } from '../services/PortfolioService';

/** The "About Me" panel — residential-sector content in readable form. */
export function AboutModal({ onClose }: { onClose: () => void }) {
  const p = PortfolioService.personal;
  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <h2 className="font-display text-sm" style={{ color: 'var(--text-accent)' }}>
        ABOUT ME
      </h2>
      <p className="font-body mt-1 text-lg" style={{ color: 'var(--text-secondary)' }}>
        {p.title} · {p.location}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {PortfolioService.about.map((para) => (
          <p key={para.slice(0, 24)} className="font-body text-xl leading-snug">
            {para}
          </p>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a className="pixel-btn pixel-btn-accent" href={`mailto:${p.contact}`}>
          EMAIL ME
        </a>
        <a className="pixel-btn" href={p.github} target="_blank" rel="noreferrer">
          GITHUB ↗
        </a>
        <a className="pixel-btn" href={p.linkedin} target="_blank" rel="noreferrer">
          LINKEDIN ↗
        </a>
      </div>

      <p className="font-body mt-5 text-base leading-snug" style={{ color: 'var(--text-secondary)' }}>
        All pixel art comes from free CraftPix cyberpunk asset packs or is drawn procedurally —
        see the repository for full attribution.
      </p>
    </Modal>
  );
}
