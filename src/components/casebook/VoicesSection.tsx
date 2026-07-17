/**
 * Voices (casebook.md §2) — the 14 clips grouped by chapter. Desktop: sticky
 * 220px left column with the Playfair-outline numeral + IM Fell title; right
 * column lists the chapter's clip cards. Mobile: header stacks above cards.
 */

import { CHAPTER_GROUPS, ALL_CLIPS } from './archive-data';
import type { VoicePlayer } from './useCasebookAudio';
import { useClipDurations } from './useClipDurations';
import ClipCard from './ClipCard';

export default function VoicesSection({ voice }: { voice: VoicePlayer }) {
  const durations = useClipDurations(ALL_CLIPS.map((c) => c.clip));

  return (
    <section aria-label="Voice recordings by chapter" className="relative mx-auto w-[min(1120px,92vw)] pb-8 pt-16 sm:pt-24">
      {CHAPTER_GROUPS.map((group) => (
        <div
          key={group.numeral}
          className="grid gap-5 border-t border-umber/50 py-10 first:border-t-0 first:pt-2 md:grid-cols-[220px_1fr] md:gap-10 md:py-14"
        >
          {/* sticky chapter column */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="flex items-end gap-4 md:block">
              <span aria-hidden="true" className="chapter-numeral block text-[3.25rem] md:text-[4.5rem]">
                {group.numeral}
              </span>
              <h2 className="pb-1 font-fell text-[0.8rem] leading-relaxed tracking-[0.24em] text-brass md:mt-3 md:pb-0">
                {group.title.toUpperCase()}
              </h2>
            </div>
          </div>

          {/* clip cards */}
          <div className="flex min-w-0 flex-col gap-4">
            {group.clips.map((clip, i) => (
              <ClipCard
                key={clip.clip}
                clip={clip}
                order={i}
                voice={voice}
                duration={durations[clip.clip]}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
