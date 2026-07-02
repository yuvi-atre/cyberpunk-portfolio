import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { EventBus, GameEvents } from '../game/EventBus';
import { PortfolioService } from '../services/PortfolioService';

const MIN_DISPLAY_MS = 1200;

/**
 * Cinematic loading gate. If a Higgsfield-generated intro video is dropped
 * at public/intro.mp4 it plays as the backdrop; otherwise a pixel-gradient
 * scene renders. The "Enter World" button appears once the Phaser scene
 * reports ready, and the whole screen wipes away with a GSAP transition.
 */
export function LoadingScreen({ onEnter }: { onEnter: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
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
      className="scanlines absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #0a0c1c 0%, #161230 45%, #4a1a44 78%, #0d0f1e 100%)',
      }}
    >
      {videoOk && (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src="./intro.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      )}

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        <h1
          className="font-display leading-relaxed"
          style={{ fontSize: 'clamp(16px, 4vw, 28px)', color: 'var(--text-accent)', textShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}
        >
          {personal.name}
        </h1>
        <p className="font-display text-[10px] md:text-sm" style={{ color: 'var(--text-secondary)' }}>
          {personal.title}
        </p>
        <p className="font-body text-xl md:text-2xl" style={{ color: 'var(--text-primary)' }}>
          {personal.tagline}
        </p>

        {ready ? (
          <button className="pixel-btn pixel-btn-accent mt-4 text-sm" onClick={enter}>
            ▶ JACK IN
          </button>
        ) : (
          <p className="font-display mt-4 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            BOOTING CITY GRID{dots}
          </p>
        )}

        <p className="font-body mt-2 max-w-md text-lg" style={{ color: 'var(--text-secondary)' }}>
          Walk with A/D · Jump with SPACE · Dash with SHIFT · Break with CLICK · Interact with E · Inventory with I
        </p>
      </div>
    </div>
  );
}
