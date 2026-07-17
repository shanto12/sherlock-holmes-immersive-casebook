/**
 * ClipCard (casebook.md §2) — one voice recording in the archive.
 * Soot card, hairline umber border (gilt while playing), wax-seal numeral,
 * speaker, first-line quote, source citation + duration chip, and a 44px
 * play button whose progress ring is bound to the clip's currentTime/duration.
 * The full transcript (from src/data/cues.ts) opens as a restyled shadcn
 * Accordion — 0.35s power2.inOut, each line ticked with a brass 1px rule.
 */

import { motion, useTransform } from 'framer-motion';
import { Loader2, Pause, Play } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CUES } from '@/data/cues';
import { cn } from '@/lib/utils';
import { formatDuration } from './useClipDurations';
import type { CaseClip } from './archive-data';
import type { VoicePlayer } from './useCasebookAudio';

const RING_R = 21;
const RING_C = 2 * Math.PI * RING_R;

/** Quote with *stressed* words rendered upright inside the italic line. */
function Quote({ text }: { text: string }) {
  const parts = text.split('*');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="not-italic">
            {part}
          </em>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

interface ClipCardProps {
  clip: CaseClip;
  /** position within its chapter group — drives the reveal stagger */
  order: number;
  voice: VoicePlayer;
  duration?: number;
}

export default function ClipCard({ clip, order, voice, duration }: ClipCardProps) {
  const isActive = voice.activeClip?.clip === clip.clip;
  const isPlaying = isActive && voice.status === 'playing';
  const isLoading = isActive && voice.status === 'loading';
  const cue = CUES[clip.cueId];
  const dashoffset = useTransform(voice.progress, [0, 1], [RING_C, 0]);
  const len = formatDuration(duration);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: order * 0.07, ease: [0.16, 1, 0.3, 1] }}
      data-cursor="LISTEN"
      aria-label={`${clip.speaker} — ${clip.quote.replaceAll('*', '')}`}
      className={cn(
        'rounded-[1.5px] border bg-soot transition-[border-color,box-shadow] duration-300',
        isActive
          ? 'border-gilt shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          : 'border-umber hover:border-brass hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]',
      )}
    >
      <div
        className={cn(
          'p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6',
          isPlaying && 'scale-[1.02]',
        )}
      >
        <div className="flex items-start gap-4 sm:gap-5">
          {/* wax-seal numeral */}
          <span
            aria-hidden="true"
            className={cn(
              'mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pipe-brown font-fell text-[0.8rem] text-bone ring-1 ring-brass/40 transition-transform duration-300',
              isPlaying && '-rotate-6',
            )}
          >
            {String(clip.index).padStart(2, '0')}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-fell text-[0.72rem] tracking-[0.3em] text-brass">{clip.speaker}</p>
            <p className="mt-1.5 font-cormorant text-[clamp(1.15rem,2vw,1.5rem)] font-semibold italic leading-snug text-bone">
              <Quote text={clip.quote} />
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <cite className="font-cormorant text-[0.95rem] italic text-bone-dim">
                — {clip.source}
              </cite>
              <span className="inline-flex items-center rounded-full border border-fog/40 px-2 py-px font-fell text-[0.7rem] tracking-[0.14em] text-fog">
                {len ?? '···'}
              </span>
            </div>
          </div>

          {/* play / pause with progress ring */}
          <button
            type="button"
            onClick={() => voice.toggle(clip)}
            aria-label={
              isPlaying
                ? `Pause ${clip.speaker.toLowerCase()}`
                : `Play ${clip.speaker.toLowerCase()}`
            }
            aria-pressed={isPlaying}
            className="relative mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brass/70 text-brass transition-colors hover:bg-brass/10 hover:text-gilt"
          >
            {isActive && voice.status !== 'idle' && (
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
                <circle
                  cx="22"
                  cy="22"
                  r={RING_R}
                  fill="none"
                  stroke="rgba(176,141,76,0.25)"
                  strokeWidth="1.5"
                />
                <motion.circle
                  cx="22"
                  cy="22"
                  r={RING_R}
                  fill="none"
                  stroke="#D4AF6A"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  style={{ strokeDashoffset: dashoffset }}
                />
              </svg>
            )}
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="ml-0.5 h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* transcript accordion */}
        {cue && (
          <Accordion type="single" collapsible className="mt-2 sm:pl-14">
            <AccordionItem value="transcript" className="border-none">
              <AccordionTrigger
                data-cursor="OPEN"
                className="justify-start gap-3 py-2.5 font-fell text-[0.7rem] tracking-[0.28em] text-bone-dim transition-colors hover:text-gilt hover:no-underline [&>svg]:size-3.5 [&>svg]:text-brass"
              >
                READ THE FULL TRANSCRIPT
              </AccordionTrigger>
              <AccordionContent
                className="pb-2 pt-1"
                style={{
                  animationDuration: '0.35s',
                  animationTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)',
                }}
              >
                <div className="flex flex-col gap-2.5 pr-2">
                  {cue.lines.map((line, i) => (
                    <p
                      key={i}
                      className="flex items-center gap-3 font-cormorant text-[1.05rem] leading-[1.6] text-bone-dim"
                    >
                      <span aria-hidden="true" className="h-[0.85em] w-px shrink-0 bg-brass/70" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </motion.article>
  );
}
