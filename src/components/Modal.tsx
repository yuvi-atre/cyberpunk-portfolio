import { useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../lib/motion';

interface Props {
  children: ReactNode;
  onClose: () => void;
  /** Tailwind max-width class for the panel. */
  maxWidth?: string;
}

/**
 * Shared modal chrome: dim backdrop, pixel panel, GSAP rise-in per
 * DESIGN.md motion tokens. Click-outside and the ✕ button close it.
 */
export function Modal({ children, onClose, maxWidth = 'max-w-lg' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!panelRef.current || !backdropRef.current || prefersReducedMotion()) return;
    gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'power2.out' });
    gsap.fromTo(
      panelRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
    );
  }, []);

  return (
    <div
      ref={backdropRef}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={`pixel-panel relative w-full ${maxWidth} max-h-[85vh] overflow-y-auto p-5 md:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="font-display absolute right-3 top-3 cursor-pointer border-0 bg-transparent text-xs"
          style={{ color: 'var(--text-secondary)' }}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
