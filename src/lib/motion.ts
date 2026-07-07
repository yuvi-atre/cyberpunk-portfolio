/**
 * Motion accessibility gate. Components check this before running GSAP
 * entrance/exit tweens: users with `prefers-reduced-motion` get the final
 * layout immediately instead of the animated ride. The CSS keyframe
 * counterpart lives in styles/index.css under the same media query.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
