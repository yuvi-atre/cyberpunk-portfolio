import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Sign } from '../services/PortfolioService';
import { prefersReducedMotion } from '../lib/motion';

/** Non-blocking holo tag for holographic signboards; auto-dismisses. */
export function SignToast({ sign, onDone }: { sign: Sign; onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current && !prefersReducedMotion()) {
      gsap.fromTo(ref.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
    }
  }, [sign.id]);

  useEffect(() => {
    const t = setTimeout(onDone, 6000);
    return () => clearTimeout(t);
  }, [sign.id, onDone]);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center px-4">
      <div ref={ref} className="holo-panel pointer-events-auto max-w-xl cursor-pointer px-5 py-3" onClick={onDone}>
        <p className="font-body text-xl leading-snug">{sign.text}</p>
      </div>
    </div>
  );
}
