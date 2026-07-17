/**
 * useCasebookAudio — the archive's playback brain, built entirely on the
 * shared AudioService singleton (single context, buses, sidechain ducking).
 *
 * Voices: one clip at a time on the dialogue bus (gain 0.9). The service
 * auto-ducks ambience −6dB / sfx −3dB while a voice plays, so Atmospheres
 * duck under dialogue exactly as on the Journey. Progress is a MotionValue
 * fed from AudioService.dialogueProgress() at rAF rate.
 *
 * Atmospheres: loops are asserted as the FULL active set on every
 * setAmbience() call (the service crossfades out anything not listed), so
 * multiple loops layer together; one-shots fire through playSfx().
 *
 * Overture reconciliation: the shared service starts its home-page Overture
 * on the very first interaction anywhere (design.md §10 — no public opt-out).
 * On this page that first gesture belongs to the archive, so:
 *  - on mount we silence any journey bed/voice that followed the visitor;
 *  - on 'unlock' we re-assert our loop set and stop the prologue unless the
 *    visitor actually asked for a clip;
 *  - while a request is in flight, a rAF reconciler retakes the dialogue bus
 *    if the Overture's delayed prologue hijacks it (and retries if the first
 *    call raced a still-suspended context).
 *
 * Note: the service exposes no offset/seek playback, so "pause" holds the
 * player open and resumes restart the clip from the top.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMotionValue } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { AudioService } from '@/audio/AudioService';
import { ATMO_MAX_GAIN, ATMO_TILES, defaultSlider } from './archive-data';
import type { CaseClip } from './archive-data';

export type VoiceStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended';

export interface VoicePlayer {
  activeClip: CaseClip | null;
  status: VoiceStatus;
  progress: MotionValue<number>;
  toggle: (clip: CaseClip) => void;
  close: () => void;
}

export interface AtmospherePlayer {
  on: Record<string, boolean>;
  vol: Record<string, number>;
  toggle: (file: string) => void;
  setVolume: (file: string, v: number) => void;
}

export interface CasebookAudio {
  voice: VoicePlayer;
  atmo: AtmospherePlayer;
}

function gainFor(vol: Record<string, number>, file: string): number {
  return ((vol[file] ?? 50) / 100) * ATMO_MAX_GAIN;
}

export function useCasebookAudio(): CasebookAudio {
  const [activeClip, setActiveClip] = useState<CaseClip | null>(null);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const progress = useMotionValue(0);

  const [atmoOn, setAtmoOn] = useState<Record<string, boolean>>({});
  const [atmoVol, setAtmoVol] = useState<Record<string, number>>(() =>
    Object.fromEntries(ATMO_TILES.map((t) => [t.file, defaultSlider(t)])),
  );

  const requestedRef = useRef<{ clip: CaseClip; at: number } | null>(null);
  const statusRef = useRef<VoiceStatus>('idle');
  const genRef = useRef(0);
  const lastRetryRef = useRef(0);
  const endTimerRef = useRef(0);

  const atmoOnRef = useRef(atmoOn);
  const atmoVolRef = useRef(atmoVol);

  // Mirror committed state into refs for event handlers / rAF callbacks.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    atmoOnRef.current = atmoOn;
  }, [atmoOn]);
  useEffect(() => {
    atmoVolRef.current = atmoVol;
  }, [atmoVol]);

  /** Full LoopSpec[] for every atmosphere loop currently switched on. */
  const activeLoopSpecs = useCallback(
    () =>
      ATMO_TILES.filter((t) => t.kind === 'loop' && atmoOnRef.current[t.file]).map((t) => ({
        name: t.file,
        gain: gainFor(atmoVolRef.current, t.file),
      })),
    [],
  );

  /* ---------------- voices ---------------- */

  const handleClipEnd = useCallback(() => {
    const gen = genRef.current;
    setStatus('ended');
    // MiniPlayer hides 0.3s after a clip ends — unless another has started.
    endTimerRef.current = window.setTimeout(() => {
      if (genRef.current !== gen) return;
      requestedRef.current = null;
      setActiveClip(null);
      setStatus('idle');
      progress.set(0);
    }, 300);
  }, [progress]);

  const startClip = useCallback(
    (clip: CaseClip) => {
      AudioService.playDialogue(clip.clip, { gain: 0.9, onEnd: handleClipEnd });
    },
    [handleClipEnd],
  );

  const playClip = useCallback(
    (clip: CaseClip) => {
      genRef.current += 1;
      window.clearTimeout(endTimerRef.current);
      requestedRef.current = { clip, at: Date.now() };
      lastRetryRef.current = Date.now();
      progress.set(0);
      setActiveClip(clip);
      setStatus('loading');
      startClip(clip);
    },
    [progress, startClip],
  );

  const toggle = useCallback(
    (clip: CaseClip) => {
      const cur = requestedRef.current;
      if (cur && cur.clip.clip === clip.clip) {
        if (statusRef.current === 'playing') {
          // pause: halt the bus, keep the player open (resume restarts — the
          // service has no offset playback)
          AudioService.stopDialogue();
          setStatus('paused');
          return;
        }
        if (statusRef.current === 'loading') return; // decode in flight
      }
      playClip(clip);
    },
    [playClip],
  );

  const close = useCallback(() => {
    genRef.current += 1;
    window.clearTimeout(endTimerRef.current);
    requestedRef.current = null;
    AudioService.stopDialogue();
    setActiveClip(null);
    setStatus('idle');
    progress.set(0);
  }, [progress]);

  // Progress feed + bus reconciler (runs only while a request is live).
  useEffect(() => {
    if (status !== 'loading' && status !== 'playing') return;
    let raf = 0;
    const tick = () => {
      const req = requestedRef.current;
      const prog = AudioService.dialogueProgress();
      if (req) {
        if (prog && prog.name === req.clip.clip) {
          if (statusRef.current !== 'playing') setStatus('playing');
          progress.set(prog.d > 0 ? Math.min(1, prog.t / prog.d) : 0);
        } else if (AudioService.state === 'running') {
          // Hijacked by the Overture's delayed prologue, or dropped while the
          // context was still suspended — retake the bus. Longer tolerance
          // while simply decoding (prog === null).
          const now = Date.now();
          const tolerance = prog ? 300 : 1200;
          if (now - req.at < 9000 && now - lastRetryRef.current > tolerance) {
            lastRetryRef.current = now;
            startClip(req.clip);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, progress, startClip]);

  /* ---------------- atmospheres ---------------- */

  const toggleAtmosphere = useCallback(
    (file: string) => {
      const tile = ATMO_TILES.find((t) => t.file === file);
      if (!tile) return;

      if (tile.kind === 'one-shot') {
        AudioService.playSfx(file, { gain: gainFor(atmoVolRef.current, file) });
        setAtmoOn((prev) => ({ ...prev, [file]: true }));
        void AudioService.loadBuffer(file).then((buf) => {
          window.setTimeout(
            () => setAtmoOn((prev) => ({ ...prev, [file]: false })),
            Math.max(400, (buf?.duration ?? 1.5) * 1000),
          );
        });
        return;
      }

      const next = { ...atmoOnRef.current, [file]: !atmoOnRef.current[file] };
      atmoOnRef.current = next;
      setAtmoOn(next);
      AudioService.setAmbience(
        ATMO_TILES.filter((t) => t.kind === 'loop' && next[t.file]).map((t) => ({
          name: t.file,
          gain: gainFor(atmoVolRef.current, t.file),
        })),
        0.8,
      );
    },
    [],
  );

  const setAtmosphereVolume = useCallback((file: string, v: number) => {
    setAtmoVol((prev) => ({ ...prev, [file]: v }));
    atmoVolRef.current = { ...atmoVolRef.current, [file]: v };
    if (atmoOnRef.current[file]) {
      AudioService.rampLoopGain(file, (v / 100) * ATMO_MAX_GAIN, 0.15);
    }
  }, []);

  /* ---------------- mount: the quiet room + unlock reconciliation ---------------- */

  useEffect(() => {
    // Silence any journey bed/voice that followed the visitor into the archive.
    AudioService.setAmbience([], 0.6);
    AudioService.stopDialogue();

    // The shared service fires its Overture on the first interaction anywhere.
    // If that first gesture happens on this page, hand the buses to the
    // archive as soon as the context unlocks (the prologue starts at ~+900ms).
    const timers: number[] = [];
    const offUnlock = AudioService.on('unlock', () => {
      [950, 1800, 2800].forEach((ms) => {
        timers.push(
          window.setTimeout(() => {
            AudioService.setAmbience(activeLoopSpecs(), 0.5);
            const req = requestedRef.current;
            if (req) {
              const prog = AudioService.dialogueProgress();
              if (!prog || prog.name !== req.clip.clip) startClip(req.clip);
            } else {
              AudioService.stopDialogue();
            }
          }, ms),
        );
      });
    });
    return () => {
      offUnlock();
      timers.forEach((t) => window.clearTimeout(t));
      window.clearTimeout(endTimerRef.current);
      AudioService.setAmbience([], 0.4);
      AudioService.stopDialogue();
    };
  }, [activeLoopSpecs, startClip]);

  return useMemo(
    () => ({
      voice: { activeClip, status, progress, toggle, close },
      atmo: { on: atmoOn, vol: atmoVol, toggle: toggleAtmosphere, setVolume: setAtmosphereVolume },
    }),
    [activeClip, status, progress, toggle, close, atmoOn, atmoVol, toggleAtmosphere, setAtmosphereVolume],
  );
}
