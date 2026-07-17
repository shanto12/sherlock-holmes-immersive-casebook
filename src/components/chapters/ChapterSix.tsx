import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AudioService } from '@/audio/AudioService';
import { useCaptions, useCueFirer } from '@/data/CaptionContext';
import { CUES } from '@/data/cues';
import { useLenis } from '@/scroll/ScrollProvider';
import IntertitlePlate from '@/components/IntertitlePlate';
import ParticleCanvas from '@/components/ParticleCanvas';
import { FULL_BLEED_IMG, SCRUB, intertitleFlicker, splitOut, useOneShots } from './shared';

gsap.registerPlugin(ScrollTrigger);

const DAWN_BED = [
  { name: 'amb_fireplace', gain: 0.16 },
  { name: 'sfx_violin', gain: 0.2 },
];

/**
 * CHAPTER VI — EPILOGUE: THE GAME IS AFOOT (340vh).
 * Dawn violin, the last words, the end card. The only warm-bright chapter.
 */
export default function ChapterSix() {
  const sectionRef = useRef<HTMLElement>(null);
  const activeRef = useRef(false);
  const { clear } = useCaptions();
  const lenis = useLenis();
  const fireCues = useCueFirer([{ cue: CUES['C-6'], trigger: 0.35 }]);
  const fireShots = useOneShots();

  // the violin ducks under Holmes' last line, then returns
  useEffect(() => {
    return AudioService.on('dialogueend', (p) => {
      if ((p as { name: string }).name === 'vo_holmes_epilogue' && activeRef.current) {
        AudioService.rampLoopGain('sfx_violin', 0.2, 1.5);
      }
    });
  }, []);

  useGSAP(
    () => {
      const root = sectionRef.current!;
      const q = gsap.utils.selector(root);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: SCRUB,
          onUpdate: (self) => {
            const p = self.progress;
            fireCues(p);
            fireShots(p, [
              { id: 'violin-duck', at: 0.35, fn: () => AudioService.rampLoopGain('sfx_violin', 0.08, 0.4) },
            ]);
          },
        },
      });

      splitOut(tl, root, 10);
      // dawn bloom swells at the window
      tl.fromTo(q('.dawn-bloom'), { opacity: 0 }, { opacity: 0.16, duration: 40, ease: 'none' }, 20);
      // the image rests behind the end card
      tl.to(q('.epilogue-dim'), { opacity: 0.6, duration: 16, ease: 'none' }, 74);
      tl.fromTo(
        q('.end-card'),
        { autoAlpha: 0, scale: 0.98 },
        { autoAlpha: 1, scale: 1, duration: 15, ease: 'none' },
        75,
      );

      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => {
          activeRef.current = self.isActive;
        },
        onEnter: () => {
          intertitleFlicker(root.querySelector('.intertitle'));
          clear();
          AudioService.setAmbience(DAWN_BED, 1.5);
        },
        onEnterBack: () => {
          clear();
          AudioService.setAmbience(DAWN_BED, 1.5);
        },
      });
    },
    { scope: sectionRef },
  );

  const replay = () =>
    lenis ? lenis.scrollTo(0, { duration: 3 }) : window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <section ref={sectionRef} id="chapter-6" className="relative" style={{ height: '340vh' }} aria-label="Chapter VI — Epilogue: The Game Is Afoot">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-ink">
        <img
          src="/assets/img/epilogue_violin.jpg"
          alt="Holmes playing violin at an open window at dawn"
          loading="lazy"
          className={FULL_BLEED_IMG}
          style={{ animation: 'drift-kb 24s ease-in-out infinite' }}
        />
        {/* dawn-rose grade + bloom at the window */}
        <div className="pointer-events-none absolute inset-0 bg-dawn-rose/10 mix-blend-overlay" aria-hidden="true" />
        <div
          className="dawn-bloom pointer-events-none absolute left-1/2 top-[30%] h-[50vh] w-[50vw] -translate-x-1/2 opacity-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,106,0.9), transparent 70%)' }}
          aria-hidden="true"
        />
        <ParticleCanvas kind="dust" count={30} />
        {/* lightens the global vignette for the one bright chapter */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(200,162,135,0.06), transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="epilogue-dim pointer-events-none absolute inset-0 bg-ink opacity-0" aria-hidden="true" />

        {/* end card */}
        <div className="end-card invisible absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center opacity-0">
          <p
            className="font-playfair font-extrabold text-bone"
            style={{ fontSize: 'clamp(2rem, 6vw, 5rem)', lineHeight: 1.05 }}
          >
            THE GAME, AS EVER,
            <br />
            IS AFOOT.
          </p>
          <div className="mt-8 h-px w-16 bg-brass" aria-hidden="true" />
          <Link
            to="/casebook"
            data-cursor="OPEN"
            className="group relative mt-8 font-fell text-[0.8rem] tracking-[0.28em] text-brass transition-colors hover:text-gilt"
          >
            OPEN THE CASEBOOK — TRANSCRIPTS &amp; VOICES
            <span
              className="absolute -bottom-2 left-0 h-px w-full origin-left scale-x-0 bg-gilt transition-transform duration-500 ease-out group-hover:scale-x-100"
              aria-hidden="true"
            />
          </Link>
          <button
            type="button"
            onClick={replay}
            data-cursor="OPEN"
            className="group relative mt-6 font-fell text-[0.8rem] tracking-[0.28em] text-bone-dim transition-colors hover:text-bone"
          >
            BEGIN THE JOURNEY ANEW
            <span
              className="absolute -bottom-2 left-0 h-px w-full origin-left scale-x-0 bg-bone-dim transition-transform duration-500 ease-out group-hover:scale-x-100"
              aria-hidden="true"
            />
          </button>
        </div>

        <IntertitlePlate
          numeral="VI"
          eyebrow="EPILOGUE"
          title="THE GAME IS AFOOT"
          subtitle="In which the game, as ever, is afoot."
        />
      </div>
    </section>
  );
}
