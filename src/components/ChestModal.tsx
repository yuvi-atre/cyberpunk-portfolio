import { Modal } from './Modal';
import { PortfolioService } from '../services/PortfolioService';

/** The treasure at the end of the ocean: future goals + a hiring CTA. */
export function ChestModal({ onClose }: { onClose: () => void }) {
  const p = PortfolioService.personal;
  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <h2 className="font-display text-sm" style={{ color: 'var(--text-accent)' }}>
        ✦ TREASURE FOUND ✦
      </h2>
      <p className="font-body mt-2 text-xl leading-snug">
        You sailed to the edge of the map — that's the kind of thoroughness I bring to code review.
        Here's what I'm charting next:
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {PortfolioService.futureGoals.map((g) => (
          <li key={g} className="pixel-panel-raised font-body px-3 py-2 text-lg">
            <span style={{ color: 'var(--text-accent)' }}>★ </span>
            {g}
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <a className="pixel-btn pixel-btn-accent" href={`mailto:${p.contact}`}>
          LET'S BUILD TOGETHER →
        </a>
      </div>
    </Modal>
  );
}
