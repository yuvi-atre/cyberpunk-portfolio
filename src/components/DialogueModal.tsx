import { useEffect, useState } from 'react';
import type { Experience } from '../services/PortfolioService';

interface Props {
  experience: Experience;
  onClose: () => void;
}

/**
 * Game-style dialogue box pinned to the bottom of the screen with a
 * typewriter effect. Represents professional references from
 * portfolio.json experience entries.
 */
export function DialogueModal({ experience, onClose }: Props) {
  const [lineIndex, setLineIndex] = useState(0);
  const [chars, setChars] = useState(0);

  const line = experience.dialogue[lineIndex] ?? '';
  const done = chars >= line.length;
  const lastLine = lineIndex >= experience.dialogue.length - 1;

  useEffect(() => {
    setChars(0);
  }, [lineIndex, experience.id]);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setChars((c) => Math.min(c + 2, line.length)), 24);
    return () => clearInterval(t);
  }, [line, done]);

  const advance = () => {
    if (!done) {
      setChars(line.length); // skip to end of line
    } else if (lastLine) {
      onClose();
    } else {
      setLineIndex((i) => i + 1);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 md:p-8">
      <div
        className="parchment-panel w-full max-w-2xl cursor-pointer p-5"
        onClick={advance}
        role="dialog"
        aria-label={`Dialogue with ${experience.npcName}`}
      >
        <div className="mb-1 flex flex-wrap items-baseline gap-3">
          <span className="font-display text-xs" style={{ color: 'var(--parchment-accent)' }}>
            {experience.npcName}
          </span>
          <span className="font-body text-base" style={{ color: '#6b5a45' }}>
            {experience.role}
          </span>
        </div>
        <p className="font-body min-h-16 text-xl leading-snug md:text-2xl">
          {line.slice(0, chars)}
          <span className="type-cursor">▌</span>
        </p>
        <div className="mt-2 flex justify-end">
          <span className="font-display text-[9px]" style={{ color: '#6b5a45' }}>
            {done ? (lastLine ? 'CLICK TO CLOSE ✕' : 'CLICK TO CONTINUE ▶') : 'CLICK TO SKIP ▶▶'}
          </span>
        </div>
      </div>
    </div>
  );
}
