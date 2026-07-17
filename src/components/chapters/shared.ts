import { useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const SCRUB = 0.6;

/** Silent-film flicker-in: opacity 0 → 0.6 → 0.2 → 1 over 0.45s + 1.5% jitter. */
export function intertitleFlicker(el: HTMLElement | null) {
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(el, { opacity: 1 });
    return;
  }
  gsap
    .timeline()
    .set(el, { opacity: 0, x: 0 })
    .to(el, { opacity: 0.6, x: -3, duration: 0.12, ease: 'none' })
    .to(el, { opacity: 0.2, x: 3, duration: 0.08, ease: 'none' })
    .to(el, { opacity: 1, x: 0, duration: 0.25, ease: 'power1.out' });
}

/**
 * Intertitle split exit on the chapter's scrubbed master timeline:
 * top half y:-102%, bottom half y:102%, power3.in.
 */
export function splitOut(tl: gsap.core.Timeline, root: HTMLElement, at: number, dur = 6) {
  const top = root.querySelector('.intertitle-half-top');
  const bottom = root.querySelector('.intertitle-half-bottom');
  if (top) tl.to(top, { yPercent: -102, ease: 'power3.in', duration: dur }, at);
  if (bottom) tl.to(bottom, { yPercent: 102, ease: 'power3.in', duration: dur }, at);
}

export interface OneShot {
  id: string;
  at: number;
  fn: () => void;
}

/**
 * Idempotent one-shot firer for SFX/visual beats keyed to chapter progress.
 * If several thresholds are crossed in one jump, only the latest fires.
 */
export function useOneShots() {
  const firedRef = useRef<Set<string>>(new Set());
  return useCallback((progress: number, entries: OneShot[]) => {
    const crossed = entries.filter((e) => e.at <= progress && !firedRef.current.has(e.id));
    if (crossed.length === 0) return;
    const latest = crossed[crossed.length - 1];
    crossed.forEach((e) => firedRef.current.add(e.id));
    latest.fn();
  }, []);
}

/** Ken Burns presets (design.md §9) as gsap from/to vars. */
export const KB = {
  push: {
    from: { scale: 1, xPercent: 0, yPercent: 0 },
    to: { scale: 1.14, xPercent: -1.5, yPercent: -1 },
  },
  pull: {
    from: { scale: 1.16, xPercent: 1, yPercent: 1.5 },
    to: { scale: 1, xPercent: 0, yPercent: 0 },
  },
  panLeft: {
    from: { scale: 1.12, xPercent: 3 },
    to: { scale: 1.12, xPercent: -3 },
  },
} as const;

/** Image classes shared by all full-bleed chapter stills. */
export const FULL_BLEED_IMG =
  'absolute inset-0 h-full w-full object-cover will-change-transform select-none';
