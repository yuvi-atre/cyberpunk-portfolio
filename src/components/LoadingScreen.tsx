import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { EventBus, GameEvents } from '../game/EventBus';
import { PortfolioService } from '../services/PortfolioService';

const MIN_DISPLAY_MS = 1200;

const CONTROLS: Array<[string, string]> = [
  ['A / D', 'walk'],
  ['SPACE', 'jump'],
  ['SHIFT', 'dash'],
  ['CLICK', 'shoot'],
  ['E', 'interact'],
  ['I', 'skills'],
];

/**
 * Welcome gate: a synthwave horizon — deep-indigo sky, glowing pink/blue
 * horizon line, and an animated perspective grid floor — under a chromatic
 * glitch title. If an intro video exists at public/intro.mp4 it plays as
 * the backdrop instead. "JACK IN" appears once the Phaser scene reports
 * ready, and the whole screen wipes away with a GSAP transition.
 */
export function LoadingScreen({ onEnter }: { onEnter: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const start = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReady = () => {
      const wait = Math.max(0, MIN_DISPLAY_MS - (Date.now() - start));
      timer = setTimeout(() => setReady(true), wait);
    };
    EventBus.on(GameEvents.SCENE_READY, onReady);
    return () => {
      EventBus.off(GameEvents.SCENE_READY, onReady);
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current.children,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.09, delay: 0.15 }
    );
  }, []);

  const enter = () => {
    if (!rootRef.current) return;
    gsap.to(rootRef.current, {
      opacity: 0,
      scale: 1.06,
      duration: 0.8,
      ease: 'power3.inOut',
      onComplete: onEnter,
    });
  };

  const personal = PortfolioService.personal;

  return (
    <div
      ref={rootRef}
      className="scanlines absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          'linear-gradient(to bottom, #0b0d20 0%, #141233 38%, #33184f 52%, #4a1a44 54%, #12142a 100%)',
      }}
    >
      {videoOk ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src="./intro.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      ) : (
        <>
          <div className="horizon-glow" />
          <div className="grid-floor" />
          {/* far skyline silhouette */}
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{
              bottom: '46%',
              height: 90,
              background:
                'linear-gradient(to top, rgba(20, 16, 44, 0.9), transparent), repeating-linear-gradient(to right, rgba(24, 20, 52, 0.95) 0 26px, transparent 26px 34px, rgba(30, 24, 64, 0.95) 34px 52px, transparent 52px 66px)',
              maskImage: 'linear-gradient(to top, #fff 55%, transparent)',
              WebkitMaskImage: 'linear-gradient(to top, #fff 55%, transparent)',
            }}
          />
        </>
      )}

      <div ref={cardRef} className="relative flex flex-col items-center gap-6 px-6 text-center">
        <p
          className="font-display text-[9px] tracking-widest md:text-[10px]"
          style={{ color: 'var(--neon-blue)', textShadow: 'var(--glow-neon)' }}
        >
          ▚ INTERACTIVE PORTFOLIO v2.0 ▞
        </p>

        <h1
          className="glitch-title font-display leading-relaxed"
          style={{ fontSize: 'clamp(18px, 5vw, 34px)' }}
        >
          {personal.name}
        </h1>

        <p
          className="font-display text-[10px] md:text-sm"
          style={{ color: 'var(--neon-pink)', textShadow: 'var(--glow-magenta)' }}
        >
          {personal.title}
        </p>

        <p className="font-body max-w-md text-xl md:text-2xl" style={{ color: 'var(--text-primary)' }}>
          {personal.tagline}
        </p>

        {ready ? (
          <button className="pixel-btn pixel-btn-accent mt-3 text-sm" onClick={enter}>
            ▶ JACK IN
          </button>
        ) : (
          <p className="font-display mt-3 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            BOOTING CITY GRID{dots}
          </p>
        )}

        <div className="mt-2 flex max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {CONTROLS.map(([key, action]) => (
            <span key={key} className="flex items-center gap-1.5">
              <kbd className="keycap">{key}</kbd>
              <span className="font-body text-base" style={{ color: 'var(--text-secondary)' }}>
                {action}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
