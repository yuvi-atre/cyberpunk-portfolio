import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Modal } from './Modal';
import type { Project } from '../services/PortfolioService';

/** Monument interior: full project case study with staggered highlight reveal. */
export function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (!listRef.current) return;
    gsap.fromTo(
      listRef.current.children,
      { x: -12, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, ease: 'power2.out', stagger: 0.08, delay: 0.15 }
    );
  }, [project.id]);

  return (
    <Modal onClose={onClose} maxWidth="max-w-xl">
      <p className="font-body text-lg" style={{ color: 'var(--text-secondary)' }}>
        {project.period}
      </p>
      <h2 className="font-display mt-1 text-sm leading-relaxed md:text-base" style={{ color: 'var(--text-accent)' }}>
        {project.name}
      </h2>
      <p className="font-body mt-3 text-xl leading-snug">{project.summary}</p>

      <ul ref={listRef} className="mt-4 flex flex-col gap-2">
        {project.highlights.map((h) => (
          <li key={h} className="pixel-panel-raised font-body px-3 py-2 text-lg leading-snug">
            <span style={{ color: 'var(--success)' }}>◆ </span>
            {h}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <span
            key={t}
            className="font-display border-2 px-2 py-1 text-[9px]"
            style={{ borderColor: 'var(--border-panel)', color: 'var(--info)', borderRadius: 2 }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {project.link && (
          <a className="pixel-btn pixel-btn-accent" href={project.link} target="_blank" rel="noreferrer">
            SOURCE CODE ↗
          </a>
        )}
        {project.live && (
          <a className="pixel-btn" href={project.live} target="_blank" rel="noreferrer">
            LIVE DEMO ↗
          </a>
        )}
      </div>
    </Modal>
  );
}
