/**
 * The Casebook — /casebook archive page (casebook.md).
 * Section 1 archive hero · Section 2 voices (14 clips, transcripts, sources)
 * · Section 3 atmospheres phonograph wall · Section 4 colophon + return link,
 * with the persistent MiniPlayer and an on-arrival fog-wipe. The Layout adds
 * no top spacing by design; the 60vh hero is the page's own top band.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArchiveHero from '@/components/casebook/ArchiveHero';
import VoicesSection from '@/components/casebook/VoicesSection';
import AtmospheresSection from '@/components/casebook/AtmospheresSection';
import MiniPlayer from '@/components/casebook/MiniPlayer';
import { useCasebookAudio } from '@/components/casebook/useCasebookAudio';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const PAGE_TITLE = 'The Casebook — Transcripts & Voices · Sherlock Holmes';
const PAGE_DESCRIPTION =
  'The complete archive: fourteen voices from the canon with full transcripts and canonical sources, plus ten atmospheres of his London wound up on the phonograph.';

/** Arrival half of the route fog-wipe: a blurred fog bank sweeps across 0.6s. */
function FogWipe({ reduced }: { reduced: boolean }) {
  const [done, setDone] = useState(false);
  if (done) return null;
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[80]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.3 : 0.5, delay: reduced ? 0 : 0.45 }}
      onAnimationComplete={() => setDone(true)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-ink" />
      {!reduced && (
        <motion.div
          className="fog-bank"
          style={{ left: '-20vw' }}
          initial={{ x: '110vw' }}
          animate={{ x: '-140vw' }}
          transition={{ duration: 0.6, ease: 'easeIn' }}
        />
      )}
    </motion.div>
  );
}

export default function Casebook() {
  const audio = useCasebookAudio();
  const reduced = useReducedMotion();

  // SEO / share (casebook.md — Audio & Performance Notes)
  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const prevDescription = meta?.getAttribute('content') ?? '';
    document.title = PAGE_TITLE;
    meta?.setAttribute('content', PAGE_DESCRIPTION);
    return () => {
      document.title = prevTitle;
      if (meta) meta.setAttribute('content', prevDescription);
    };
  }, []);

  const playerOpen = audio.voice.activeClip !== null && audio.voice.status !== 'idle';

  return (
    <div className="relative min-h-[100dvh] bg-ink">
      <FogWipe reduced={reduced} />

      <ArchiveHero />
      <VoicesSection voice={audio.voice} />
      <AtmospheresSection atmo={audio.atmo} />

      {/* Section 4 — colophon + return */}
      <footer className="relative border-t border-umber/50">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex max-w-[560px] flex-col items-center px-6 pb-20 pt-20 text-center"
        >
          <div className="flex w-48 items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-brass/60" />
            <span className="block h-1.5 w-1.5 rotate-45 bg-brass" />
            <span className="h-px flex-1 bg-brass/60" />
          </div>

          <p className="mt-8 font-cormorant text-[1.05rem] leading-[2rem] text-bone-dim">
            Voices &amp; soundscapes produced with ElevenLabs · Text adapted from the canon of Sir
            Arthur Conan Doyle (public domain) · Set in Playfair Display, Cormorant Garamond &amp;
            IM Fell English
          </p>

          <Link
            to="/"
            data-cursor="OPEN"
            className="mt-10 font-fell text-[0.8rem] tracking-[0.24em] text-brass transition-colors hover:text-gilt"
          >
            ← RETURN TO THE JOURNEY
          </Link>
        </motion.div>
      </footer>

      {/* keep the colophon clear of the fixed player */}
      <div aria-hidden="true" className={playerOpen ? 'h-[88px]' : 'h-0'} />

      <MiniPlayer voice={audio.voice} />
    </div>
  );
}
