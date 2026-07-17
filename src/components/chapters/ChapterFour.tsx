import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AudioService } from '@/audio/AudioService';
import { useCaptions, useCueFirer } from '@/data/CaptionContext';
import { CUES, CHAPTER_AUDIO } from '@/data/cues';
import { FogBank } from '@/components/Atmosphere';
import IntertitlePlate from '@/components/IntertitlePlate';
import ParticleCanvas from '@/components/ParticleCanvas';
import { FULL_BLEED_IMG, SCRUB, intertitleFlicker, splitOut, useOneShots } from './shared';

gsap.registerPlugin(ScrollTrigger);

const MOOR_BED = [{ name: 'amb_moor', gain: 0.32, filterFreq: 1200 }];

/**
 * CHAPTER IV — THE HOUND OF THE BASKERVILLES (400vh). The darkest chapter.
 * Fog density ramps 40→120; the hound's eyes ignite at 0.60; two howls; a shudder.
 */
export default function ChapterFour() {
  const sectionRef = useRef<HTMLElement>(null);
  const densityRef = useRef(1);
  const { clear } = useCaptions();
  const [eyesOn, setEyesOn] = useState(false);
  const fireCues = useCueFirer([
    { cue: CUES['C-4a'], trigger: 0.3 },
    { cue: CUES['C-4b'], trigger: 0.8 },
  ]);
  const fireShots = useOneShots();

  useGSAP(
    () => {
      const root = sectionRef.current!;
      const q = gsap.utils.selector(root);

      const shudder = () => {
        gsap
          .timeline()
          .to(q('.moor-stage'), { x: 3, y: 2, duration: 0.09, ease: 'none' })
          .to(q('.moor-stage'), { x: -3, y: -2, duration: 0.09, ease: 'none' })
          .to(q('.moor-stage'), { x: 2, y: 1, duration: 0.09, ease: 'none' })
          .to(q('.moor-stage'), { x: 0, y: 0, duration: 0.09, ease: 'none' });
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: SCRUB,
          onUpdate: (self) => {
            const p = self.progress;
            densityRef.current = 1 + p * 2; // fog motes 40 → 120
            fireCues(p);
            fireShots(p, [
              {
                id: 'howl-1',
                at: 0.35,
                fn: () => AudioService.playSfx('sfx_hound_howl', { gain: 0.5, pan: -0.5, echo: true }),
              },
              {
                id: 'eyes',
                at: 0.6,
                fn: () => {
                  setEyesOn(true);
                  AudioService.rampLoopFilter('amb_moor', 8000, 2);
                },
              },
              { id: 'howl-2', at: 0.75, fn: () => AudioService.playSfx('sfx_hound_howl', { gain: 0.6, pan: 0.3 }) },
              { id: 'shudder', at: 0.82, fn: shudder },
            ]);
          },
        },
      });

      splitOut(tl, root, 10);
      // creeping toward the tor, the whole chapter long
      tl.fromTo(q('.moor-img'), { scale: 1 }, { scale: 1.1, duration: 100, ease: 'none' }, 0);
      // deepening dark
      tl.fromTo(q('.moor-dark'), { opacity: 0 }, { opacity: 0.45, duration: 100, ease: 'none' }, 0);
      // hard cut to the Falls
      tl.to(q('.moor-stage'), { opacity: 0, duration: 4, ease: 'none' }, 96);

      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          intertitleFlicker(root.querySelector('.intertitle'));
          clear();
          AudioService.setAmbience(MOOR_BED, 1.5);
          void AudioService.preload(CHAPTER_AUDIO[5]);
        },
        onEnterBack: () => {
          clear();
          AudioService.setAmbience(MOOR_BED, 1.5);
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="chapter-4" className="relative" style={{ height: '400vh' }} aria-label="Chapter IV — The Hound of the Baskervilles">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-ink">
        <div className="moor-stage absolute inset-0 will-change-transform">
          <img
            src="/assets/img/moor_hound.jpg"
            alt="Dartmoor by night — a giant hound silhouette upon a tor"
            loading="lazy"
            className={`moor-img ${FULL_BLEED_IMG}`}
            style={{ objectPosition: 'center 65%' }}
          />
          {/* moor-green grade + deepening vignette */}
          <div className="pointer-events-none absolute inset-0 bg-moor-green/[0.12] mix-blend-overlay" aria-hidden="true" />
          <div
            className="moor-dark pointer-events-none absolute inset-0 opacity-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(13,11,8,0.9) 100%)' }}
            aria-hidden="true"
          />
          {/* moonlight through torn cloud */}
          <div
            className="pointer-events-none absolute inset-y-0 w-[45vw] bg-fog/[0.06]"
            style={{ filter: 'blur(40px)', animation: 'cloud-tear 60s linear infinite' }}
            aria-hidden="true"
          />
          <FogBank variant="a" duration={30} opacity={0.18} />
          <FogBank variant="b" duration={45} opacity={0.14} />
          <ParticleCanvas kind="fog" count={40} densityRef={densityRef} />

          {/* the hound's eyes — ignite at progress 0.60 */}
          {['71.5%', '73.2%'].map((left) => (
            <span
              key={left}
              className="pointer-events-none absolute h-1.5 w-1.5 rounded-full transition-opacity duration-700"
              style={{
                left,
                top: '34%',
                opacity: eyesOn ? 1 : 0,
                background: 'radial-gradient(circle, #D4AF6A, rgba(212,175,106,0.1))',
                filter: 'blur(2px) drop-shadow(0 0 12px #D4AF6A)',
                animation: eyesOn ? 'eye-flicker 0.9s steps(3) infinite' : 'none',
              }}
              aria-hidden="true"
            />
          ))}

          <p className="absolute bottom-8 right-8 font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim">
            DARTMOOR — BY NIGHT
          </p>
        </div>

        <IntertitlePlate
          numeral="IV"
          title="THE HOUND OF THE BASKERVILLES"
          subtitle="In which a hound of hell walks upon the moor."
        />
      </div>
    </section>
  );
}
