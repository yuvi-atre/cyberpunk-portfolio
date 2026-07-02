import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Skill } from '../services/PortfolioService';

/** "Item pickup" banner when an ore is mined. */
export function SkillToast({ skill, onDone }: { skill: Skill; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { y: -16, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [skill.id]);

  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [skill.id, onDone]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-20 flex justify-center px-4">
      <div ref={ref} className="pixel-panel px-5 py-3 text-center" style={{ borderColor: 'var(--border-accent)' }}>
        <div className="font-display text-[10px]" style={{ color: 'var(--text-accent)' }}>
          ⛏ SKILL ACQUIRED
        </div>
        <div className="font-body mt-1 text-xl">{skill.displayName}</div>
      </div>
    </div>
  );
}
