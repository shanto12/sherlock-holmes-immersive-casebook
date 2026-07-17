import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { CaptionCue } from '@/data/cues';
import { AudioService } from '@/audio/AudioService';

interface CaptionContextValue {
  /** The cue currently typing in the dock. */
  active: CaptionCue | null;
  /** The previous cue, held dimmed above the active one (Watson marginalia). */
  history: CaptionCue | null;
  /** Increments per push so the typewriter restarts. */
  generation: number;
  /** Push a caption cue and (if audio is live) play its voice clip. */
  fire: (cue: CaptionCue) => void;
  /** Push a caption cue without audio (large-quote scenes sync their own clip). */
  show: (cue: CaptionCue) => void;
  /** Clear dock on chapter change. */
  clear: () => void;
}

const CaptionContext = createContext<CaptionContextValue | null>(null);

export function CaptionProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<CaptionCue | null>(null);
  const [history, setHistory] = useState<CaptionCue | null>(null);
  const [generation, setGeneration] = useState(0);

  const show = useCallback((cue: CaptionCue) => {
    setActive((prev) => {
      if (prev && prev.id !== cue.id) setHistory(prev);
      return cue;
    });
    setGeneration((g) => g + 1);
  }, []);

  const fire = useCallback(
    (cue: CaptionCue) => {
      show(cue);
      AudioService.playDialogue(cue.clip);
    },
    [show],
  );

  const clear = useCallback(() => {
    setActive(null);
    setHistory(null);
  }, []);

  const value = useMemo(
    () => ({ active, history, generation, fire, show, clear }),
    [active, history, generation, fire, show, clear],
  );

  return <CaptionContext.Provider value={value}>{children}</CaptionContext.Provider>;
}

export function useCaptions(): CaptionContextValue {
  const ctx = useContext(CaptionContext);
  if (!ctx) throw new Error('useCaptions must be used inside CaptionProvider');
  return ctx;
}

export interface CueEntry {
  cue: CaptionCue;
  /** chapter progress threshold (0–1) at which the cue fires */
  trigger: number;
  /** fire without playing the clip (rare — quote scenes play it themselves) */
  silent?: boolean;
}

/**
 * Idempotent, one-shot cue firer for a chapter's ScrollTrigger onUpdate.
 * - Each cue fires once per visit when its threshold passes.
 * - If several thresholds are crossed in one jump (fast scroll / rail jump),
 *   only the latest fires — skipped cues stay silent, never queue-stacked.
 */
export function useCueFirer(entries: CueEntry[]) {
  const { fire, show } = useCaptions();
  const firedRef = useRef<Set<string>>(new Set());
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  return useCallback(
    (progress: number) => {
      const crossed = entriesRef.current.filter(
        (e) => e.trigger <= progress && !firedRef.current.has(e.cue.id),
      );
      if (crossed.length === 0) return;
      // Only the latest crossed cue fires; earlier ones are skipped silently.
      const latest = crossed[crossed.length - 1];
      crossed.forEach((e) => firedRef.current.add(e.cue.id));
      if (latest.silent) show(latest.cue);
      else fire(latest.cue);
    },
    [fire, show],
  );
}
