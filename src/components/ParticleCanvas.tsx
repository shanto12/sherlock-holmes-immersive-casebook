import { useEffect, useRef } from 'react';
import type { CSSProperties, RefObject } from 'react';

export type ParticleKind = 'fog' | 'rain' | 'mist' | 'dust';

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  phase: number;
}

/**
 * One active 2D-canvas particle system per chapter stage (design.md §8.4).
 * Kinds: fog motes · rain streaks · mist spray · gold dust motes.
 * Paused off-screen via IntersectionObserver; count halved on mobile.
 */
export default function ParticleCanvas({
  kind,
  count = 40,
  slantDeg = 4,
  densityRef,
  className = '',
  style,
}: {
  kind: ParticleKind;
  count?: number;
  /** rain slant in degrees (4° sitting room, 6° chase) */
  slantDeg?: number;
  /** optional live multiplier 0..n (e.g. moor fog 40→120 across the chapter) */
  densityRef?: RefObject<number>;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const base = isMobile ? Math.ceil(count / 2) : count;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let running = false;
    let last = performance.now();

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (initial: boolean): Particle => {
      switch (kind) {
        case 'rain': {
          const speed = rand(300, 520);
          const slant = (slantDeg * Math.PI) / 180;
          return {
            x: rand(-40, w + 40),
            y: initial ? rand(-h, 0) : rand(-60, -10),
            r: rand(2, 8),
            vx: Math.sin(slant) * speed,
            vy: Math.cos(slant) * speed,
            alpha: rand(0.1, 0.2),
            phase: rand(0, Math.PI * 2),
          };
        }
        case 'mist':
          return {
            x: rand(0, w),
            y: initial ? rand(h * 0.5, h + 60) : rand(h, h + 60),
            r: rand(14, 46),
            vx: rand(-6, 6),
            vy: -rand(20, 40),
            alpha: rand(0.03, 0.08),
            phase: rand(0, Math.PI * 2),
          };
        case 'dust':
          return {
            x: rand(0, w),
            y: rand(0, h),
            r: rand(0.8, 2),
            vx: rand(-4, 4),
            vy: -rand(2, 7),
            alpha: rand(0.12, 0.3),
            phase: rand(0, Math.PI * 2),
          };
        default: // fog motes
          return {
            x: rand(0, w),
            y: kind === 'fog' && densityRef ? rand(h * 0.6, h) : rand(0, h),
            r: rand(1, 3),
            vx: rand(6, 14),
            vy: rand(-2, 2),
            alpha: rand(0.1, 0.25),
            phase: rand(0, Math.PI * 2),
          };
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(base * (densityRef?.current ?? 1));
      particles = Array.from({ length: target }, () => spawn(true));
    };

    const step = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // live density ramp (moor chapter)
      if (densityRef) {
        const target = Math.round(base * densityRef.current);
        while (particles.length < target) particles.push(spawn(false));
        if (particles.length > target) particles.length = target;
      }

      ctx.clearRect(0, 0, w, h);
      const t = now / 1000;
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (kind === 'rain') {
          if (p.y > h + 20) Object.assign(p, spawn(false));
          ctx.strokeStyle = `rgba(141,155,166,${p.alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.02, p.y - p.r * 2.2);
          ctx.stroke();
          continue;
        }

        // wrap horizontally, recycle vertically
        if (p.x > w + 60) p.x = -60;
        if (p.x < -60) p.x = w + 60;
        if (p.y < -80) Object.assign(p, spawn(false), { x: rand(0, w) });
        if (p.y > h + 80) p.y = -80;

        const wobble = Math.sin(t * 0.6 + p.phase) * 8;
        const alpha = p.alpha * (0.7 + 0.3 * Math.sin(t * 0.9 + p.phase));
        if (kind === 'dust') {
          ctx.fillStyle = `rgba(212,175,106,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x + wobble, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (kind === 'mist') {
          const grad = ctx.createRadialGradient(p.x + wobble, p.y, 0, p.x + wobble, p.y, p.r);
          grad.addColorStop(0, `rgba(141,155,166,${alpha})`);
          grad.addColorStop(1, 'rgba(141,155,166,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x + wobble, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(141,155,166,${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x + wobble, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(
      (entriesList) => entriesList.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0.02 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, [kind, count, slantDeg, densityRef]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
