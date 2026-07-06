import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { PortfolioService } from '../services/PortfolioService';

/**
 * Recruiter Mode: a zero-gameplay express lane. Pauses the game (App emits
 * the pause event) and presents every project as a clean, accessible card
 * grid with direct links — no walking, jumping or shooting required.
 */
export function RecruiterMode({ onClose }: { onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current || !gridRef.current) return;
    gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out' });
    gsap.fromTo(
      gridRef.current.children,
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.07, delay: 0.1 }
    );
  }, []);

  const { personal, projects, skills, futureGoals } = PortfolioService.all;

  return (
    <div
      ref={rootRef}
      className="scanlines absolute inset-0 z-30 overflow-y-auto"
      style={{ background: 'rgba(9, 10, 22, 0.96)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Recruiter mode — project index"
    >
      <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
        {/* header */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="font-display text-[9px] tracking-widest"
              style={{ color: 'var(--neon-blue)', textShadow: 'var(--glow-neon)' }}
            >
              ▚ RECRUITER MODE — GAME PAUSED ▞
            </p>
            <h1
              className="font-display mt-3 text-base md:text-xl"
              style={{ color: 'var(--neon-pink)', textShadow: 'var(--glow-magenta)' }}
            >
              {personal.name}
            </h1>
            <p className="font-body mt-2 text-xl" style={{ color: 'var(--text-primary)' }}>
              {personal.title} · {personal.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="pixel-btn" href={`mailto:${personal.contact}`}>
              EMAIL
            </a>
            <a className="pixel-btn" href={personal.github} target="_blank" rel="noreferrer">
              GITHUB
            </a>
            <a className="pixel-btn" href={personal.linkedin} target="_blank" rel="noreferrer">
              LINKEDIN
            </a>
            <button className="pixel-btn pixel-btn-accent" onClick={onClose} autoFocus>
              ✕ RESUME GAME
            </button>
          </div>
        </header>

        {/* project grid */}
        <div
          ref={gridRef}
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        >
          {projects.map((p) => (
            <article key={p.id} className="term-screen flex flex-col p-5">
              <p className="font-body text-base" style={{ color: 'var(--text-secondary)' }}>
                {p.period}
              </p>
              <h2
                className="font-display mt-1 text-xs leading-relaxed"
                style={{ color: 'var(--neon-blue)' }}
              >
                {p.name}
              </h2>
              <p className="font-body mt-3 text-lg leading-snug">{p.summary}</p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {p.highlights.map((h) => (
                  <li key={h} className="font-body text-base leading-snug" style={{ color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--success)' }}>◆ </span>
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <span
                    key={t}
                    className="font-display border-2 px-1.5 py-1 text-[8px]"
                    style={{ borderColor: 'var(--border-panel)', color: 'var(--info)' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {p.live && (
                  <a className="pixel-btn pixel-btn-accent" href={p.live} target="_blank" rel="noreferrer">
                    LIVE SITE ↗
                  </a>
                )}
                {p.link && (
                  <a className="pixel-btn" href={p.link} target="_blank" rel="noreferrer">
                    SOURCE ↗
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* skills + future goals */}
        <footer className="flex flex-col gap-4 pb-6 md:flex-row">
          <section className="pixel-panel flex-1 p-4" aria-label="Skills">
            <h3 className="font-display text-[10px]" style={{ color: 'var(--neon-pink)' }}>
              SKILL MATRIX
            </h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s.id}
                  className="font-display border-2 px-1.5 py-1 text-[8px]"
                  style={{
                    borderColor: s.tier === 'advanced' ? 'var(--neon-blue)' : 'var(--border-panel)',
                    color: s.tier === 'advanced' ? 'var(--neon-blue)' : 'var(--text-secondary)',
                  }}
                  title={s.description}
                >
                  {s.displayName.toUpperCase()}
                </span>
              ))}
            </div>
          </section>
          <section className="pixel-panel flex-1 p-4" aria-label="Future goals">
            <h3 className="font-display text-[10px]" style={{ color: 'var(--neon-pink)' }}>
              NEXT OBJECTIVES
            </h3>
            <ul className="mt-3 flex flex-col gap-1.5">
              {futureGoals.map((g) => (
                <li key={g} className="font-body text-lg" style={{ color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--neon-blue)' }}>▸ </span>
                  {g}
                </li>
              ))}
            </ul>
          </section>
        </footer>
      </div>
    </div>
  );
}
