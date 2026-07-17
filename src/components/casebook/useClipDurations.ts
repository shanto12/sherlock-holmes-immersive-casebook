import { useEffect, useState } from 'react';

const BASE = '/assets/audio/';

/**
 * Duration lookup for the archive's duration chips. The AudioService only
 * learns a clip's length after decoding (and evicts decoded buffers past 12),
 * so chips read cheap `loadedmetadata` from inert elements instead — playback
 * itself always stays with the AudioService; these elements never play.
 */
export function useClipDurations(names: string[]): Record<string, number> {
  const [durations, setDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    const els: HTMLAudioElement[] = [];
    names.forEach((name) => {
      const el = new Audio();
      el.preload = 'metadata';
      const onMeta = () => {
        if (!cancelled && Number.isFinite(el.duration) && el.duration > 0) {
          setDurations((prev) => (prev[name] ? prev : { ...prev, [name]: el.duration }));
        }
      };
      el.addEventListener('loadedmetadata', onMeta);
      el.src = `${BASE}${name}.mp3`;
      els.push(el);
    });
    return () => {
      cancelled = true;
      els.forEach((el) => {
        el.removeAttribute('src');
        el.load();
      });
    };
    // the names list is static for this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return durations;
}

/** m:ss for the chip, or null while metadata is still arriving. */
export function formatDuration(sec: number | undefined): string | null {
  if (sec === undefined || !Number.isFinite(sec) || sec <= 0) return null;
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
