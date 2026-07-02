import { Modal } from './Modal';
import { PortfolioService } from '../services/PortfolioService';

/** The cache in the exclusion-zone ruins: future goals + a hiring CTA. */
export function ChestModal({ onClose }: { onClose: () => void }) {
  const p = PortfolioService.personal;
  return (
    <Modal onClose={onClose} maxWidth="max-w-lg">
      <h2 className="font-display text-sm" style={{ color: 'var(--text-accent)' }}>
        ✦ DATA CACHE DECRYPTED ✦
      </h2>
      <p className="font-body mt-2 text-xl leading-snug">
        You walked to the edge of the grid — that's the kind of thoroughness I bring to code review.
        Here's what I'm compiling next:
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
