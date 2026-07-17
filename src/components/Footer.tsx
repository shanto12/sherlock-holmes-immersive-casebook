import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLenis } from '@/scroll/ScrollProvider';

const item = {
  hidden: { opacity: 0, y: 20 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

/**
 * Footer — the colophon (design.md §11 + copy deck).
 * Brass ornament rule, eyebrow, credits, Casebook link, return-to-top.
 */
export default function Footer() {
  const lenis = useLenis();
  const toTop = () =>
    lenis ? lenis.scrollTo(0, { duration: 3 }) : window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative bg-ink">
      <motion.div
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.08 }}
        className="mx-auto flex max-w-[560px] flex-col items-center px-6 pb-16 pt-32 text-center"
      >
        {/* brass ornament rule — lines flanking a lozenge */}
        <motion.div variants={item} className="flex w-48 items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-brass/60" />
          <span className="block h-1.5 w-1.5 rotate-45 bg-brass" />
          <span className="h-px flex-1 bg-brass/60" />
        </motion.div>

        <motion.p
          variants={item}
          className="mt-8 font-fell text-[0.75rem] tracking-[0.34em] text-brass"
        >
          AN IMMERSIVE CASEBOOK IN SIX CHAPTERS
        </motion.p>

        <motion.p
          variants={item}
          className="mt-6 font-cormorant text-[1.05rem] leading-[2rem] text-bone-dim"
        >
          Voices &amp; soundscapes produced with ElevenLabs · Text adapted from the canon of Sir
          Arthur Conan Doyle (public domain) · Set in Playfair Display, Cormorant Garamond &amp; IM
          Fell English
        </motion.p>

        <motion.nav variants={item} className="mt-10 flex items-center gap-8" aria-label="Colophon">
          <Link
            to="/casebook"
            data-cursor="OPEN"
            className="font-fell text-[0.75rem] tracking-[0.24em] text-brass transition-colors hover:text-gilt"
          >
            THE CASEBOOK
          </Link>
          <button
            type="button"
            onClick={toTop}
            data-cursor="OPEN"
            className="font-fell text-[0.75rem] tracking-[0.24em] text-brass transition-colors hover:text-gilt"
          >
            RETURN TO THE DOOR
          </button>
        </motion.nav>

        <motion.p variants={item} className="mt-12 font-fell text-[0.7rem] tracking-[0.2em] text-bone-dim/60">
          © 1895–2025 · 221B BAKER STREET, LONDON
        </motion.p>
      </motion.div>
    </footer>
  );
}
