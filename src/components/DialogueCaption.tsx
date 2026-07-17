import { useEffect, useRef, useState } from 'react';
import { useCaptions } from '@/data/CaptionContext';
import type { CaptionCue } from '@/data/cues';
import { AudioService } from '@/audio/AudioService';

const FALLBACK_CPS = 55; // chars/sec when silent (home.md)
const HOLD_MS = 1600;
const FADE_MS = 400;

function flatText(cue: CaptionCue): string {
  return cue.lines.join('\n');
}

/**
 * DialogueCaption — the bottom-left caption dock (design.md §11).
 * Typewriter reveal synced to the voice clip's currentTime/duration via the
 * AudioService (measured at runtime); falls back to 55 chars/sec when silent.
 * Previous cue holds dimmed above the active one (max 2 visible).
 */
export default function DialogueCaption() {
  const { active, history, generation } = useCaptions();
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'hold' | 'leaving' | 'gone'>('gone');
  const startRef = useRef(0);
  const maxTypedRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setPhase('gone');
      setTyped(0);
      return;
    }
    const total = flatText(active).length;
    setTyped(0);
    setPhase('typing');
    startRef.current = performance.now();
    maxTypedRef.current = 0;
    let raf = 0;
    let holdTimer = 0;
    let fadeTimer = 0;

    const tick = (now: number) => {
      const prog = AudioService.dialogueProgress();
      let count: number;
      if (prog && prog.name === active.clip) {
        count = Math.floor((prog.t / prog.d) * total);
      } else {
        count = Math.floor(((now - startRef.current) / 1000) * FALLBACK_CPS);
      }
      // never walk backwards if the audio source drops out mid-cue
      count = Math.max(count, maxTypedRef.current);
      maxTypedRef.current = count;
      if (count >= total) {
        setTyped(total);
        setPhase('hold');
        holdTimer = window.setTimeout(() => {
          setPhase('leaving');
          fadeTimer = window.setTimeout(() => setPhase('gone'), FADE_MS);
        }, HOLD_MS);
        return;
      }
      setTyped(count);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      window.clearTimeout(fadeTimer);
    };
    // generation restarts the typewriter when a cue is re-pushed
  }, [active, generation]);

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-4 z-40 w-[min(560px,92vw)] sm:bottom-10 sm:left-8"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-live="polite"
    >
      {history && (
        <div className="mb-3 border-l-2 border-brass/40 bg-ink/40 px-5 py-3 opacity-40 backdrop-blur-sm">
          <p className="font-fell text-[0.66rem] tracking-[0.3em] text-brass/80">{history.speaker}</p>
          <p className="mt-1 whitespace-pre-line font-cormorant text-[clamp(0.95rem,1.6vw,1.15rem)] italic leading-snug text-bone-dim">
            {flatText(history)}
          </p>
        </div>
      )}
      {active && phase !== 'gone' && (
        <div
          className="border-l-2 border-brass bg-ink/55 px-6 py-5 backdrop-blur-md transition-all"
          style={{
            transitionDuration: `${FADE_MS}ms`,
            opacity: phase === 'leaving' ? 0 : 1,
            transform: phase === 'leaving' ? 'translateY(-10px)' : 'translateY(0)',
          }}
        >
          <p className="font-fell text-[0.72rem] tracking-[0.32em] text-brass">{active.speaker}</p>
          <CaptionBody cue={active} typed={typed} typing={phase === 'typing'} />
        </div>
      )}
    </div>
  );
}

function CaptionBody({ cue, typed, typing }: { cue: CaptionCue; typed: number; typing: boolean }) {
  // Walk the flat text line by line so multi-line cues type sequentially.
  let remaining = typed;
  return (
    <p className="mt-2 max-w-[34ch] font-cormorant text-[clamp(1.25rem,2.4vw,1.9rem)] font-semibold italic leading-[1.35] text-bone">
      {cue.lines.map((line, i) => {
        const shown = Math.max(0, Math.min(line.length, remaining));
        remaining -= line.length + 1; // +1 for the joined newline
        const isCurrent = shown < line.length && shown > 0;
        const isLast = i === cue.lines.length - 1;
        return (
          <span key={i} className="block">
            {line.slice(0, shown)}
            {typing && (isCurrent || (isLast && shown >= line.length - 1)) && (
              <span className="type-caret" aria-hidden="true" />
            )}
          </span>
        );
      })}
    </p>
  );
}
