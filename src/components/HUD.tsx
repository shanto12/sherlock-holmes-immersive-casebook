import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AudioService } from '@/audio/AudioService';
import { useLenis } from '@/scroll/ScrollProvider';

const CHAPTERS = [
  { id: 'chapter-1', numeral: 'I', title: '221B Baker Street' },
  { id: 'chapter-2', numeral: 'II', title: 'The Mind of Holmes' },
  { id: 'chapter-3', numeral: 'III', title: 'A Scandal in Bohemia' },
  { id: 'chapter-4', numeral: 'IV', title: 'The Hound of the Baskervilles' },
  { id: 'chapter-5', numeral: 'V', title: 'The Final Problem' },
  { id: 'chapter-6', numeral: 'VI', title: 'The Game Is Afoot' },
];

/** Wax-seal monogram (top-left) — click returns to the door (scroll top). */
function WaxSeal({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="OPEN"
      aria-label="Return to the beginning"
      className="text-shadow-hud block transition-transform hover:scale-105"
    >
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="20" fill="#3B2D22" stroke="#B08D4C" strokeWidth="1" />
        <circle cx="22" cy="22" r="16.5" fill="none" stroke="#B08D4C" strokeWidth="0.5" opacity="0.7" />
        <circle cx="22" cy="22" r="20" fill="none" stroke="#D4AF6A" strokeWidth="0.5" opacity="0.35" strokeDasharray="2 3" />
        <text
          x="22"
          y="27.5"
          textAnchor="middle"
          fontFamily="'IM Fell English SC', Georgia, serif"
          fontSize="13"
          fill="#D4AF6A"
        >
          S.H.
        </text>
      </svg>
    </button>
  );
}

/** Gramophone sound toggle — appears after first unlock; ramps MasterBus 0/1. */
export function SoundToggle() {
  const [unlocked, setUnlocked] = useState(AudioService.unlocked);
  const [muted, setMuted] = useState(AudioService.muted);

  useEffect(() => {
    const offU = AudioService.on('unlock', () => setUnlocked(true));
    const offM = AudioService.on('mute', (p) => setMuted((p as { muted: boolean }).muted));
    return () => {
      offU();
      offM();
    };
  }, []);

  if (!unlocked) return null;

  return (
    <button
      type="button"
      onClick={() => AudioService.toggleMuted()}
      data-cursor="LISTEN"
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      aria-pressed={!muted}
      className="text-shadow-hud block transition-transform hover:scale-105"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        {/* horn */}
        <path
          d="M14 22 L10 8 Q9.5 5.5 12 6.5 L24 12 Q26 13 24.5 14.5 L16 24 Z"
          fill="none"
          stroke={muted ? '#B8AB8E' : '#D4AF6A'}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* tone arm + base */}
        <path d="M16 24 L24 30" stroke={muted ? '#B8AB8E' : '#B08D4C'} strokeWidth="1.2" />
        <rect x="20" y="28" width="14" height="7" rx="1" fill="none" stroke={muted ? '#B8AB8E' : '#B08D4C'} strokeWidth="1.2" />
        {/* sound-wave arcs when playing */}
        {!muted &&
          [0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${7 - i * 2.6} ${14 - i * 2.2} Q ${2.5 - i * 2} ${16.5} ${7 - i * 2.6} ${19 + i * 2.2}`}
              fill="none"
              stroke="#D4AF6A"
              strokeWidth="1"
              opacity="0.9"
            >
              <animate
                attributeName="opacity"
                values="0.15;0.9;0.15"
                dur="1.6s"
                begin={`${i * 0.28}s`}
                repeatCount="indefinite"
              />
            </path>
          ))}
        {/* muted slash */}
        {muted && <path d="M6 6 L34 34" stroke="#B8AB8E" strokeWidth="1.4" />}
      </svg>
    </button>
  );
}

/** Right-edge chapter rail: roman-numeral dots I–VI with tooltips. */
function ChapterRail() {
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  const [hasChapters, setHasChapters] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onMq = () => setIsDesktop(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const mid = window.scrollY + window.innerHeight * 0.5;
      let current = 0;
      let found = false;
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el) {
          found = true;
          if (el.offsetTop <= mid) current = i;
        }
      });
      setHasChapters(found);
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!hasChapters) return null;

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 2.2 });
    else el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav aria-label="Chapters" className="flex flex-col items-center gap-4">
      <TooltipProvider delayDuration={150}>
        {CHAPTERS.map((c, i) => {
          const dot = (
            <button
              type="button"
              onClick={() => jump(c.id)}
              aria-label={`Chapter ${c.numeral} — ${c.title}`}
              className="relative flex h-4 w-4 items-center justify-center"
            >
              <span
                className={`block h-2 w-2 rounded-full border transition-all duration-300 ${
                  i === active
                    ? 'border-gilt bg-gilt shadow-[0_0_12px_rgba(212,175,106,0.9)]'
                    : 'border-brass bg-transparent hover:border-gilt'
                }`}
              />
            </button>
          );
          return isDesktop ? (
            <Tooltip key={c.id}>
              <TooltipTrigger asChild>{dot}</TooltipTrigger>
              <TooltipContent
                side="left"
                className="border-brass/40 bg-soot font-fell text-[0.7rem] tracking-[0.24em] text-bone"
              >
                {c.numeral} · {c.title.toUpperCase()}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span key={c.id}>{dot}</span>
          );
        })}
      </TooltipProvider>
    </nav>
  );
}

/**
 * HUD — the fixed chrome of the whole experience (design.md §11).
 * Fades in after the Overture. No traditional navbar: this IS the chrome.
 */
export default function HUD() {
  const lenis = useLenis();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setVisible(window.scrollY > window.innerHeight * 0.55);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`pointer-events-none fixed inset-0 z-50 transition-[opacity,visibility] duration-700 ${
        visible ? 'visible opacity-100' : 'invisible opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto absolute left-5 top-5 sm:left-7 sm:top-6">
        <WaxSeal onClick={() => (lenis ? lenis.scrollTo(0, { duration: 2.4 }) : window.scrollTo({ top: 0, behavior: 'smooth' }))} />
      </div>
      <div className="pointer-events-auto absolute right-5 top-5 sm:right-7 sm:top-6">
        <SoundToggle />
      </div>
      <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 sm:right-6">
        <ChapterRail />
      </div>
    </header>
  );
}
