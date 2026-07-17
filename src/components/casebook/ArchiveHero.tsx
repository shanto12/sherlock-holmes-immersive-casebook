/**
 * Archive hero (casebook.md §1) — 60vh band over a heavily dimmed
 * baker_street_fog.jpg with a slow KB-drift. Title chars rise with a stagger,
 * subtitle words follow, backdrop crossfades from black. On scroll the hero
 * parallaxes -10vh and fades out over its own height. Reduced motion: drift
 * and staggers become simple fades.
 */

import { memo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const EASE_OUT = [0.215, 0.61, 0.355, 1] as [number, number, number, number];

const TITLE = 'THE CASEBOOK';
const SUBTITLE =
  'Fourteen voices from the canon, with their transcripts and sources — and the sounds of his London, wound up on the phonograph.';

/** Dimmed fog still with a free-running 30s KB-drift (isolated + memoized). */
const HeroBackdrop = memo(function HeroBackdrop({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      aria-hidden="true"
    >
      <motion.img
        src="/assets/img/baker_street_fog.jpg"
        alt=""
        className="h-full w-full object-cover"
        style={{ opacity: 0.18, filter: 'brightness(0.7)' }}
        animate={reduced ? undefined : { scale: [1, 1.05, 1] }}
        transition={reduced ? undefined : { duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* melt the band into the page ground */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-transparent to-ink" />
    </motion.div>
  );
});

export default function ArchiveHero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0vh', '-10vh']);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={ref}
      aria-label="The Casebook archive"
      className="relative flex h-[60vh] min-h-[430px] items-center justify-center overflow-hidden"
    >
      <HeroBackdrop reduced={reduced} />

      <motion.div
        style={reduced ? undefined : { y, opacity }}
        className="relative z-10 flex flex-col items-center px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim"
        >
          221B BAKER STREET — UP THE SEVENTEEN STEPS
        </motion.p>

        <h1
          aria-label="The Casebook"
          className="mt-5 font-playfair text-[clamp(2.6rem,8vw,6.5rem)] font-extrabold leading-[0.95] tracking-[0.01em] text-bone"
        >
          {TITLE.split('').map((ch, i) => (
            <motion.span
              key={`${ch}-${i}`}
              aria-hidden="true"
              className="inline-block"
              initial={{ opacity: 0, y: reduced ? 0 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduced
                  ? { duration: 0.3 }
                  : { duration: 0.9, delay: 0.2 + i * 0.04, ease: EASE_OUT }
              }
            >
              {ch === ' ' ? ' ' : ch}
            </motion.span>
          ))}
        </h1>

        <p
          aria-label={SUBTITLE}
          className="mt-6 max-w-[52ch] font-cormorant text-[clamp(1.05rem,1.8vw,1.4rem)] italic leading-relaxed text-bone-dim"
        >
          {SUBTITLE.split(' ').map((word, i, arr) => (
            <motion.span
              key={`${word}-${i}`}
              aria-hidden="true"
              className="inline-block"
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.3 : 0.5, delay: reduced ? 0 : 0.6 + i * 0.05 }}
            >
              {word}
              {i < arr.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: reduced ? 0.2 : 1.5 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <span className="h-px w-16 bg-brass/70" aria-hidden="true" />
          <p className="font-fell text-[0.7rem] tracking-[0.28em] text-brass">
            14 VOICES · 10 ATMOSPHERES · 6 CHAPTERS
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
