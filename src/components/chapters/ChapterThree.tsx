import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AudioService } from '@/audio/AudioService';
import { useCaptions, useCueFirer } from '@/data/CaptionContext';
import { CUES, CHAPTER_AUDIO } from '@/data/cues';
import IntertitlePlate from '@/components/IntertitlePlate';
import ParticleCanvas from '@/components/ParticleCanvas';
import { FULL_BLEED_IMG, SCRUB, intertitleFlicker, splitOut, useOneShots } from './shared';

gsap.registerPlugin(ScrollTrigger);

const BED = [
  { name: 'amb_london_street', gain: 0.25 },
  { name: 'amb_rain_window', gain: 0.1 },
];

/**
 * CHAPTER III — A SCANDAL IN BOHEMIA (460vh).
 * The hansom chase → the developing photograph of Irene Adler.
 */
export default function ChapterThree() {
  const sectionRef = useRef<HTMLElement>(null);
  const { clear } = useCaptions();
  const fireCues = useCueFirer([
    { cue: CUES['C-3a'], trigger: 0.6 },
    { cue: CUES['C-3b'], trigger: 0.74 },
    { cue: CUES['C-3c'], trigger: 0.88 },
  ]);
  const fireShots = useOneShots();

  useGSAP(
    () => {
      const root = sectionRef.current!;
      const q = gsap.utils.selector(root);
      const gallop = (gain: number, pan?: number) => {
        AudioService.playSfx('sfx_horse_gallop', { gain, pan });
        // the street bed swells +3dB under the hooves, then settles
        AudioService.rampLoopGain('amb_london_street', 0.35, 0.6);
        window.setTimeout(() => AudioService.rampLoopGain('amb_london_street', 0.25, 0.6), 4500);
      };

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
              { id: 'gallop-1', at: 0.14, fn: () => gallop(0.5) },
              { id: 'gallop-2', at: 0.3, fn: () => gallop(0.42, 0.4) },
              { id: 'bed', at: 0.92, fn: () => AudioService.setAmbience([{ name: 'amb_moor', gain: 0.32, filterFreq: 1200 }], 1.5) },
            ]);
          },
        },
      });

      /* ---- III-A: the chase (0–45) ---- */
      splitOut(tl, root, 10);
      tl.fromTo(
        q('.chase-img'),
        { scale: 1.14, xPercent: 4, transformOrigin: '20% 60%' },
        { scale: 1.14, xPercent: -4, duration: 45, ease: 'none' },
        0,
      );
      // whip out as the photograph scene crossfades in
      tl.to(q('.chase-stage'), { xPercent: -30, autoAlpha: 0, duration: 5, ease: 'power2.in' }, 40);

      /* ---- III-B: the photograph (45–100) ---- */
      tl.fromTo(q('.photo-stage'), { opacity: 0 }, { opacity: 1, duration: 5, ease: 'none' }, 42);
      // the developing photograph (signature): darkroom filter scrub
      tl.fromTo(
        q('.photo-img'),
        { filter: 'sepia(1) brightness(0.55) blur(10px) contrast(0.8)' },
        { filter: 'sepia(0.15) brightness(1) blur(0px) contrast(1)', duration: 17, ease: 'none' },
        45,
      );
      // frame settles from a slight rotation
      tl.fromTo(q('.photo-frame'), { rotate: 1.5 }, { rotate: 0, duration: 10, ease: 'none' }, 45);
      // Holmes keeps the photograph: the frame drifts up and dims
      tl.to(q('.photo-frame'), { y: '-6vh', opacity: 0.4, duration: 3, ease: 'none' }, 97);

      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          intertitleFlicker(root.querySelector('.intertitle'));
          clear();
          AudioService.setAmbience(BED, 1.5);
          void AudioService.preload(CHAPTER_AUDIO[4]);
        },
        onEnterBack: () => {
          clear();
          AudioService.setAmbience(BED, 1.5);
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="chapter-3" className="relative" style={{ height: '460vh' }} aria-label="Chapter III — A Scandal in Bohemia">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-ink">
        {/* faint oxblood grade — the only warm-red chapter */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-oxblood/[0.08] mix-blend-overlay" aria-hidden="true" />

        {/* ---------- III-A: the chase ---------- */}
        <div className="chase-stage absolute inset-0 will-change-transform">
          <img
            src="/assets/img/carriage_chase.jpg"
            alt="A hansom cab galloping through night streets"
            loading="lazy"
            className={`chase-img ${FULL_BLEED_IMG}`}
          />
          <ParticleCanvas kind="rain" count={60} slantDeg={6} />
          {/* speed streaks */}
          {[1.4, 2.1, 2.8].map((dur, i) => (
            <div
              key={i}
              className="pointer-events-none absolute h-px w-[34vw] bg-fog/10"
              style={{
                top: `${22 + i * 26}%`,
                animation: `speed-streak ${dur}s linear ${i * 0.5}s infinite`,
              }}
              aria-hidden="true"
            />
          ))}
          {/* hansom-lamp glow */}
          <div
            className="pointer-events-none absolute left-[30%] top-[52%] h-24 w-24"
            style={{
              background: 'radial-gradient(circle, rgba(212,175,106,0.1), transparent 70%)',
              animation: 'lantern-bob 1.2s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <p className="absolute bottom-8 right-8 font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim">
            ST. JOHN'S WOOD — BY HANSOM, AT A GALLOP
          </p>
        </div>

        {/* ---------- III-B: the photograph ---------- */}
        <div className="photo-stage absolute inset-0 flex items-center justify-center bg-soot opacity-0">
          <span aria-hidden="true" className="chapter-numeral pointer-events-none absolute text-[clamp(8rem,22vw,20rem)] opacity-[0.16]">
            III
          </span>
          <figure className="photo-frame relative will-change-transform">
            <div className="intertitle-border bg-soot p-3 shadow-[0_30px_80px_rgba(0,0,0,0.7)] transition-transform duration-300 ease-out hover:-translate-y-1.5">
              <img
                src="/assets/img/irene_adler.jpg"
                alt="Irene Adler in velvet, holding a photograph"
                loading="lazy"
                className="photo-img max-h-[62vh] w-auto object-cover will-change-[filter] md:max-h-[64vh]"
              />
            </div>
            <figcaption className="mt-4 text-center">
              <p className="font-fell text-[0.75rem] tracking-[0.3em] text-brass">IRENE ADLER — “THE WOMAN”</p>
              <p className="mt-1 font-cormorant italic text-bone-dim">
                opera singer · adventuress · the one who beat him
              </p>
            </figcaption>
          </figure>
        </div>

        <IntertitlePlate
          numeral="III"
          title="A SCANDAL IN BOHEMIA"
          subtitle="In which a woman outwits the great detective."
        />
      </div>
    </section>
  );
}
