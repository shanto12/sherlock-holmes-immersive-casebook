import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AudioService } from '@/audio/AudioService';
import { useCaptions } from '@/data/CaptionContext';
import { CUES, CHAPTER_AUDIO } from '@/data/cues';
import { FogBank } from '@/components/Atmosphere';
import ParticleCanvas from '@/components/ParticleCanvas';
import { FULL_BLEED_IMG, KB, SCRUB } from './shared';

gsap.registerPlugin(ScrollTrigger);

const TITLE = 'SHERLOCK HOLMES';

/**
 * SECTION 0 — OVERTURE (200vh). Fog reveal, title lockup, Watson's prologue.
 */
export default function Overture() {
  const sectionRef = useRef<HTMLElement>(null);
  const { show } = useCaptions();

  // Watson's prologue caption begins when audio unlocks (synced by clip name).
  useEffect(() => {
    let timer = 0;
    const off = AudioService.on('unlock', () => {
      timer = window.setTimeout(() => show(CUES['C-0']), 900);
    });
    if (AudioService.unlocked) timer = window.setTimeout(() => show(CUES['C-0']), 900);
    return () => {
      off();
      window.clearTimeout(timer);
    };
  }, [show]);

  useGSAP(
    () => {
      const root = sectionRef.current!;
      const q = gsap.utils.selector(root);

      /* ---- load timeline (plays once) ---- */
      const load = gsap.timeline({ defaults: { ease: 'power3.out' } });
      load.fromTo(root.querySelector('.stage'), { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0);
      load.fromTo(
        q('.title-char'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.045 },
        0.3,
      );
      load.fromTo(q('.overture-eyebrow, .overture-rule'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.2);
      load.fromTo(q('.overture-sub'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 1.3);
      load.fromTo(q('.scroll-hint'), { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.6);
      // scroll-hint line pulses (scaleY 1→0.2, 1.8s yoyo)
      gsap.to(q('.scroll-hint-line'), {
        scaleY: 0.2,
        transformOrigin: 'top',
        duration: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      /* ---- scrubbed over 200vh ---- */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: SCRUB,
        },
      });
      // KB-push on the street still
      tl.fromTo(q('.overture-img'), KB.push.from, { ...KB.push.to, duration: 100, ease: 'none' }, 0);
      // title lockup parallax out across the first 60%
      tl.to(q('.title-lockup'), { y: '-18vh', opacity: 0, duration: 60, ease: 'none' }, 0);
      tl.to(q('.scroll-hint'), { opacity: 0, duration: 12, ease: 'none' }, 0);
      // fog counter-drift
      tl.fromTo(q('.fog-a'), { x: '0vw' }, { x: '-12vw', duration: 100, ease: 'none' }, 0);
      tl.fromTo(q('.fog-b'), { x: '0vw' }, { x: '9vw', duration: 100, ease: 'none' }, 0);
      // final 40%: scene dims toward Chapter I
      tl.to(q('.overture-dim'), { filter: 'brightness(0.55)', duration: 40, ease: 'none' }, 60);

      /* ---- chapter housekeeping ---- */
      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          void AudioService.preload(CHAPTER_AUDIO[1]);
        },
        onEnterBack: () => {
          AudioService.setAmbience([{ name: 'amb_london_street', gain: 0.2 }], 1.5);
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="overture" className="relative" style={{ height: '200vh' }} aria-label="Overture">
      <div className="stage sticky top-0 h-[100dvh] overflow-hidden">
        <div className="overture-dim absolute inset-0 will-change-[filter]">
          <img
            src="/assets/img/baker_street_fog.jpg"
            alt="Fog-drowned Baker Street at night, gas lamps blooming amber"
            className={`overture-img ${FULL_BLEED_IMG}`}
            style={{ objectPosition: 'center 60%' }}
            fetchPriority="high"
          />
        </div>

        {/* drifting fog banks */}
        <div className="fog-a absolute inset-0 will-change-transform">
          <FogBank variant="a" duration={60} opacity={0.2} />
        </div>
        <div className="fog-b absolute inset-0 will-change-transform">
          <FogBank variant="b" duration={90} opacity={0.14} />
        </div>
        <ParticleCanvas kind="fog" count={40} />

        {/* title lockup */}
        <div className="title-lockup absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-transform">
          <p className="overture-eyebrow font-fell text-[0.75rem] tracking-[0.34em] text-brass opacity-0">
            AN IMMERSIVE CASEBOOK IN SIX CHAPTERS
          </p>
          <h1
            className="mt-6 font-playfair font-extrabold leading-[0.95] tracking-[0.01em] text-bone"
            style={{ fontSize: 'clamp(3rem, 11vw, 10rem)' }}
          >
            {TITLE.split(' ').map((word, wi) => (
              <span key={wi} className="inline-block whitespace-nowrap">
                {word.split('').map((ch, ci) => (
                  <span key={ci} className="title-char inline-block will-change-transform">
                    {ch}
                  </span>
                ))}
                {wi === 0 && <span className="inline-block">&nbsp;</span>}
              </span>
            ))}
          </h1>
          <div className="overture-rule mt-7 h-px w-16 bg-brass opacity-0" aria-hidden="true" />
          <p
            className="overture-sub mt-6 font-playfair italic text-bone-dim opacity-0"
            style={{ fontSize: 'clamp(1.2rem, 3vw, 2.4rem)' }}
          >
            a study in fog &amp; gaslight
          </p>
        </div>

        {/* scroll hint */}
        <div className="scroll-hint absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 opacity-0">
          <p className="font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim">
            SCROLL TO BEGIN THE INQUIRY
          </p>
          <span className="scroll-hint-line block h-10 w-px bg-bone-dim/70" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
