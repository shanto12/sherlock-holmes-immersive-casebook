/**
 * MiniPlayer (casebook.md §"MiniPlayer") — fixed 72px bottom bar that springs
 * up when a clip starts and slides away 0.3s after it ends: wax-seal thumb,
 * speaker + truncated quote line, brass progress bar, play/pause, close.
 * Progress binds to the shared MotionValue (no per-frame re-renders).
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, X } from 'lucide-react';
import type { VoicePlayer } from './useCasebookAudio';

export default function MiniPlayer({ voice }: { voice: VoicePlayer }) {
  const { activeClip, status, progress, toggle, close } = voice;
  const show = activeClip !== null && status !== 'idle';
  const isPlaying = status === 'playing';

  return (
    <AnimatePresence>
      {show && activeClip && (
        <motion.div
          key="casebook-miniplayer"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="region"
          aria-label="Now playing"
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-umber bg-[rgba(23,19,16,0.85)] backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto flex h-[72px] w-[min(1120px,92vw)] items-center gap-3 sm:gap-4">
            {/* wax-seal thumb */}
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pipe-brown font-fell text-[0.8rem] text-bone ring-1 ring-brass/40"
            >
              {String(activeClip.index).padStart(2, '0')}
            </span>

            {/* speaker + quote + progress */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-3">
                <p className="shrink-0 font-fell text-[0.66rem] tracking-[0.28em] text-brass">
                  {activeClip.speaker}
                </p>
                <p className="hidden truncate font-cormorant text-[0.95rem] italic text-bone-dim min-[420px]:block">
                  {activeClip.quote.replaceAll('*', '')}
                </p>
              </div>
              <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-umber">
                <motion.div
                  className="h-full w-full origin-left bg-brass"
                  style={{ scaleX: progress }}
                />
              </div>
            </div>

            {/* play / pause */}
            <button
              type="button"
              onClick={() => toggle(activeClip)}
              data-cursor="LISTEN"
              aria-label={isPlaying ? 'Pause clip' : 'Play clip'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brass/70 text-brass transition-colors hover:bg-brass/10 hover:text-gilt"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {/* close */}
            <button
              type="button"
              onClick={close}
              aria-label="Close player"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-bone-dim transition-colors hover:text-bone"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
