import { useEffect, useRef, useState } from 'react';

/**
 * Custom cursor (design.md §9): 12px brass ring + 3px bone dot trailing at
 * lerp 0.18; expands to 48px with an IM Fell micro-label over interactive
 * elements ([data-cursor="EXAMINE"|"LISTEN"|"OPEN"]). Desktop fine-pointer
 * only; native cursor preserved on touch and prefers-reduced-motion.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add('custom-cursor');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { x: target.x, y: target.y };
    let raf = 0;
    let visible = false;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      visible = true;
      const el = (e.target as HTMLElement | null)?.closest?.('[data-cursor]');
      setLabel(el ? el.getAttribute('data-cursor') : null);
    };
    const onLeave = () => {
      visible = false;
    };

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
        ringRef.current.style.opacity = visible ? '1' : '0';
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.x}px, ${target.y}px) translate(-50%, -50%)`;
        dotRef.current.style.opacity = visible ? '1' : '0';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.classList.remove('custom-cursor');
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed left-0 top-0 z-[90] flex items-center justify-center rounded-full border border-brass transition-[width,height,background-color,border-color] duration-200 ${
          label ? 'h-12 w-12 border-gilt bg-ink/40 backdrop-blur-[1px]' : 'h-3 w-3'
        }`}
      >
        {label && (
          <span className="font-fell text-[0.5rem] tracking-[0.22em] text-gilt">{label}</span>
        )}
      </div>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[90] h-[3px] w-[3px] rounded-full bg-bone"
      />
    </>
  );
}
