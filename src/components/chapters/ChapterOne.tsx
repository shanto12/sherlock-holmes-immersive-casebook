import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AudioService } from '@/audio/AudioService';
import { useCueFirer } from '@/data/CaptionContext';
import { CUES, CHAPTER_AUDIO } from '@/data/cues';
import { FogBank } from '@/components/Atmosphere';
import IntertitlePlate from '@/components/IntertitlePlate';
import ParticleCanvas from '@/components/ParticleCanvas';
import { FULL_BLEED_IMG, KB, SCRUB, intertitleFlicker, splitOut, useOneShots } from './shared';

gsap.registerPlugin(ScrollTrigger);

const STREET_BED = [{ name: 'amb_london_street', gain: 0.2 }];
const INTERIOR_BED = [
  { name: 'amb_fireplace', gain: 0.25 },
  { name: 'amb_rain_window', gain: 0.13 },
];

/**
 * CHAPTER I — PROLOGUE: 221B BAKER STREET (420vh).
 * Street approach → the black door with brass numerals → through the keyhole.
 */
export default function ChapterOne() {
  const sectionRef = useRef<HTMLElement>(null);
  const fireCues = useCueFirer([
    { cue: CUES['C-1a'], trigger: 0.58 },
    { cue: CUES['C-1b'], trigger: 0.8 },
  ]);
  const fireShots = useOneShots();

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
              {
                id: 'footsteps',
                at: 0.25,
                fn: () => AudioService.playSfx('sfx_footsteps', { gain: 0.45, pan: -0.3, panTo: 0.3 }),
              },
              { id: 'bed', at: 0.92, fn: () => AudioService.setAmbience(INTERIOR_BED, 1.5) },
            ]);
          },
        },
      });

      // fog-bank wipe sweeping in from the right (chapter boundary)
      tl.fromTo(q('.fog-wipe'), { xPercent: 110 }, { xPercent: -110, duration: 8, ease: 'none' }, 0);
      // intertitle holds 12%, then splits
      splitOut(tl, root, 12);
      // street: slow pan toward the door glow
      tl.fromTo(q('.street-img'), KB.panLeft.from, { ...KB.panLeft.to, duration: 45, ease: 'none' }, 0);
      // the destination glow at frame-right
      tl.fromTo(
        q('.door-glow'),
        { opacity: 0, scale: 0.8 },
        { opacity: 0.9, scale: 1, duration: 25, ease: 'none' },
        15,
      );
      // crossfade street → door (45→55)
      tl.fromTo(q('.door-wrap'), { opacity: 0 }, { opacity: 1, duration: 10, ease: 'none' }, 45);
      // door: pushing toward the 221B numerals / keyhole
      tl.fromTo(
        q('.door-img'),
        { scale: 1, transformOrigin: '50% 38%' },
        { scale: 1.22, duration: 45, ease: 'none' },
        50,
      );
      tl.fromTo(q('.street-label'), { opacity: 0 }, { opacity: 1, duration: 4 }, 56);
      tl.to(q('.street-label'), { opacity: 0, duration: 4 }, 92);
      // through the keyhole: handoff to Chapter II's firelight
      tl.fromTo(q('.keyhole-glow'), { opacity: 0 }, { opacity: 0.35, duration: 3 }, 95);
      tl.to(q('.door-wrap'), { scale: 1.9, filter: 'brightness(0.2)', duration: 5, ease: 'power2.in' }, 95);

      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          intertitleFlicker(root.querySelector('.intertitle'));
          AudioService.setAmbience(STREET_BED, 1.5);
          void AudioService.preload(CHAPTER_AUDIO[2]);
        },
        onEnterBack: () => AudioService.setAmbience(STREET_BED, 1.5),
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="chapter-1" className="relative" style={{ height: '420vh' }} aria-label="Chapter I — 221B Baker Street">
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Scene I-A — the street */}
        <img
          src="/assets/img/baker_street_fog.jpg"
          alt="Baker Street in fog, a hansom cab waiting"
          loading="lazy"
          className={`street-img ${FULL_BLEED_IMG}`}
          style={{ objectPosition: '80% center' }}
        />
        <div
          className="door-glow pointer-events-none absolute right-[12%] top-[38%] h-[34vh] w-[24vw] opacity-0"
          style={{ background: 'radial-gradient(ellipse at center, rgba(212,175,106,0.12), transparent 70%)' }}
          aria-hidden="true"
        />
        <ParticleCanvas kind="fog" count={40} />

        {/* Scene I-B — the door */}
        <div className="door-wrap absolute inset-0 opacity-0 will-change-transform">
          <img
            src="/assets/img/door_221b.jpg"
            alt="The black door of 221B, brass numerals catching gaslight"
            loading="lazy"
            className={`door-img ${FULL_BLEED_IMG}`}
            style={{ objectPosition: 'center 40%' }}
          />
          <div
            className="keyhole-glow pointer-events-none absolute inset-0 opacity-0"
            style={{ background: 'radial-gradient(circle at 50% 42%, rgba(212,175,106,0.5), transparent 30%)' }}
            aria-hidden="true"
          />
        </div>

        <p className="street-label absolute left-6 top-24 font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim opacity-0 sm:left-10">
          BAKER STREET, W1
        </p>

        <FogBank variant="a" duration={70} opacity={0.12} />

        {/* fog wipe + intertitle */}
        <div className="fog-wipe pointer-events-none absolute inset-y-[-20%] left-0 z-30 w-[140vw] will-change-transform">
          <div className="fog-bank" style={{ left: 0, opacity: 0.3 }} />
        </div>
        <IntertitlePlate
          numeral="I"
          eyebrow="PROLOGUE"
          title="221B BAKER STREET"
          subtitle="In which fog rolls over Baker Street, and a door stands waiting."
        />
      </div>
    </section>
  );
}
