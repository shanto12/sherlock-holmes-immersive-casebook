import { useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AudioService } from '@/audio/AudioService';
import { useCaptions, useCueFirer } from '@/data/CaptionContext';
import { CUES, CHAPTER_AUDIO } from '@/data/cues';
import IntertitlePlate from '@/components/IntertitlePlate';
import ParticleCanvas from '@/components/ParticleCanvas';
import { FULL_BLEED_IMG, KB, SCRUB, intertitleFlicker, splitOut, useOneShots } from './shared';

gsap.registerPlugin(ScrollTrigger);

const MORIARTY_Q = 'You hope to place me in the dock, Mr. Holmes. I assure you — it will end in your destruction.';
const HOLMES_Q = 'He is the Napoleon of crime, Watson. He sits motionless, like a spider in the centre of its web.';

/** Spider's web geometry: 8 spokes + 4 concentric snagged rings (100×100 viewBox). */
function useWebPaths() {
  return useMemo(() => {
    const cx = 50;
    const cy = 34;
    const spokes: string[] = [];
    const rings: string[] = [];
    const N = 8;
    const pt = (angle: number, r: number) => {
      const a = (angle * Math.PI) / 180;
      // squash vertically to read as a web over the portrait
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.82] as const;
    };
    for (let i = 0; i < N; i++) {
      const angle = (360 / N) * i - 90;
      const [x, y] = pt(angle, 48);
      spokes.push(`M${cx} ${cy} L${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    for (const r of [11, 21, 31, 41]) {
      let d = '';
      for (let i = 0; i <= N; i++) {
        const angle = (360 / N) * (i % N) - 90;
        const [x, y] = pt(angle, r);
        d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      rings.push(`${d}Z`);
    }
    return { spokes, rings };
  }, []);
}

/**
 * CHAPTER V — THE FINAL PROBLEM (560vh).
 * The spider's web → the Reichenbach Falls (letterbox, silence beat, mourning card).
 */
export default function ChapterFive() {
  const sectionRef = useRef<HTMLElement>(null);
  const { clear } = useCaptions();
  const { spokes, rings } = useWebPaths();
  const lastGainRef = useRef(0.4);
  const [frozen, setFrozen] = useState(false);
  const fireCues = useCueFirer([{ cue: CUES['C-5c'], trigger: 0.72 }]);
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
            // waterfall crescendo 0.4 → 0.7 across the approach to the Falls
            if (p >= 0.5 && p < 0.7) {
              const g = 0.4 + ((p - 0.5) / 0.2) * 0.3;
              if (Math.abs(g - lastGainRef.current) > 0.03) {
                lastGainRef.current = g;
                AudioService.rampLoopGain('amb_waterfall', g, 0.4);
              }
            }
            fireCues(p);
            fireShots(p, [
              { id: 'moriarty-vo', at: 0.18, fn: () => AudioService.playDialogue('vo_moriarty') },
              { id: 'holmes-vo', at: 0.32, fn: () => AudioService.playDialogue('vo_holmes_final') },
              {
                id: 'falls-heard',
                at: 0.4,
                fn: () => {
                  AudioService.setAmbience([{ name: 'amb_waterfall', gain: 0.4 }], 2);
                  lastGainRef.current = 0.4;
                },
              },
              {
                id: 'silence',
                at: 0.7,
                fn: () => {
                  AudioService.silenceBeat(1.2);
                  setFrozen(true);
                  window.setTimeout(() => setFrozen(false), 1600);
                },
              },
              {
                id: 'farewell-bed',
                at: 0.72,
                fn: () => AudioService.rampLoopGain('amb_waterfall', 0.15, 0.8),
              },
              {
                id: 'falls-return',
                at: 0.9,
                fn: () => {
                  AudioService.rampLoopGain('amb_waterfall', 0.4, 1);
                  lastGainRef.current = 0.4;
                },
              },
              {
                id: 'dawn-bed',
                at: 0.93,
                fn: () =>
                  AudioService.setAmbience(
                    [
                      { name: 'amb_fireplace', gain: 0.16 },
                      { name: 'sfx_violin', gain: 0.2 },
                    ],
                    1.5,
                  ),
              },
            ]);
          },
        },
      });

      /* ---- V-A: the spider's web (0–45) ---- */
      splitOut(tl, root, 10);
      tl.fromTo(
        q('.moriarty-img'),
        { scale: 1, transformOrigin: '50% 32%', filter: 'brightness(0.85)' },
        { scale: 1.12, duration: 35, ease: 'none' },
        10,
      );
      tl.to(q('.moriarty-img'), { filter: 'brightness(1)', duration: 12, ease: 'none' }, 30);
      // the web draws itself: spokes first, rings following (DOM order)
      tl.fromTo(
        q('.web-path'),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 26, stagger: { amount: 20 }, ease: 'none' },
        14,
      );
      // the confrontation in large quotes
      tl.fromTo(q('.wq'), { opacity: 0.12 }, { opacity: 1, duration: 2, stagger: { amount: 16 }, ease: 'none' }, 20);
      // the plunge: through the portrait into white spray
      tl.to(q('.web-stage'), { scale: 1.4, filter: 'brightness(0)', autoAlpha: 0, duration: 2, ease: 'power2.in' }, 43);

      /* ---- V-B: the Falls (45–92) ---- */
      tl.fromTo(q('.falls-stage'), { opacity: 0 }, { opacity: 1, duration: 3, ease: 'none' }, 45);
      tl.fromTo(q('.falls-img'), KB.pull.from, { ...KB.pull.to, duration: 47, ease: 'none' }, 45);
      // letterbox in at 0.50, retract at 0.90
      tl.fromTo(q('.lb-top'), { yPercent: -100 }, { yPercent: 0, duration: 4, ease: 'power2.out' }, 50);
      tl.fromTo(q('.lb-bottom'), { yPercent: 100 }, { yPercent: 0, duration: 4, ease: 'power2.out' }, 50);
      tl.to(q('.lb-top'), { yPercent: -100, duration: 2, ease: 'power2.in' }, 90);
      tl.to(q('.lb-bottom'), { yPercent: 100, duration: 2, ease: 'power2.in' }, 90);
      // the mourning card
      tl.fromTo(q('.mourning-card'), { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 6, ease: 'power2.out' }, 80);
      tl.to(q('.mourning-card'), { opacity: 0, duration: 2, ease: 'none' }, 90);

      /* ---- V-C: washout to dawn (92–100) ---- */
      tl.to(q('.falls-stage'), { opacity: 0, duration: 6, ease: 'none' }, 94);

      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          intertitleFlicker(root.querySelector('.intertitle'));
          clear();
          AudioService.setAmbience([], 1.5); // moor wind dies; the Falls are not yet heard
          void AudioService.preload(CHAPTER_AUDIO[6]);
        },
        onEnterBack: () => {
          clear();
        },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} id="chapter-5" className="relative" style={{ height: '560vh' }} aria-label="Chapter V — The Final Problem">
      <div className={`sticky top-0 h-[100dvh] overflow-hidden bg-ink ${frozen ? 'frozen' : ''}`}>
        {/* ---------- V-A: the spider's web ---------- */}
        <div className="web-stage absolute inset-0 flex flex-col-reverse will-change-transform md:flex-row">
          <div className="relative flex flex-1 items-center bg-soot px-6 py-10 md:px-14">
            <div className="relative max-w-[34ch]">
              <p className="font-fell text-[0.72rem] tracking-[0.32em] text-brass">PROFESSOR MORIARTY</p>
              <p className="mt-4 font-cormorant font-semibold italic leading-[1.3] text-bone-dim" style={{ fontSize: 'clamp(1.25rem,2.4vw,2rem)' }}>
                {MORIARTY_Q.split(' ').map((w, i) => (
                  <span key={i} className="wq inline-block opacity-[0.12]">{w}&nbsp;</span>
                ))}
              </p>
              <p className="mt-8 font-fell text-[0.72rem] tracking-[0.32em] text-brass">SHERLOCK HOLMES</p>
              <p className="mt-4 font-cormorant font-semibold italic leading-[1.3] text-bone" style={{ fontSize: 'clamp(1.25rem,2.4vw,2rem)' }}>
                {HOLMES_Q.split(' ').map((w, i) => (
                  <span key={i} className="wq inline-block opacity-[0.12]">{w}&nbsp;</span>
                ))}
              </p>
            </div>
          </div>
          <div className="relative h-[45vh] w-full overflow-hidden md:h-full md:w-[45%]">
            <img
              src="/assets/img/moriarty.jpg"
              alt="Professor Moriarty — gaunt, reptilian stillness"
              loading="lazy"
              className="moriarty-img absolute inset-0 h-full w-full object-cover will-change-transform"
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              style={{ animation: 'web-tremble 8s ease-in-out infinite' }}
            >
              {[...spokes, ...rings].map((d, i) => (
                <path
                  key={i}
                  d={d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1}
                  className="web-path"
                  fill="none"
                  stroke="#8D9BA6"
                  strokeOpacity="0.35"
                  strokeWidth="0.35"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* ---------- V-B: the Falls ---------- */}
        <div className="falls-stage absolute inset-0 opacity-0">
          <img
            src="/assets/img/reichenbach.jpg"
            alt="The Reichenbach Falls — two figures on a cliff path above the abyss"
            loading="lazy"
            className={`falls-img ${FULL_BLEED_IMG}`}
            style={{ objectPosition: 'center 30%' }}
          />
          {/* waterfall shimmer */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] opacity-[0.08]"
            style={{
              background: 'repeating-linear-gradient(to bottom, rgba(233,223,201,0.7) 0 2px, transparent 2px 9px)',
              animation: 'falls-shimmer 0.9s linear infinite',
            }}
            aria-hidden="true"
          />
          <ParticleCanvas kind="mist" count={40} />
          <p className="absolute bottom-[8vh] right-8 z-20 font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim">
            THE REICHENBACH FALLS — SWITZERLAND, 1891
          </p>

          {/* letterbox bars */}
          <div className="lb-top letterbox-bar top-0" aria-hidden="true" />
          <div className="lb-bottom letterbox-bar bottom-0" aria-hidden="true" />

          {/* the mourning card */}
          <div className="mourning-card absolute inset-0 z-20 flex items-center justify-center opacity-0">
            <div className="mx-6 w-full max-w-[480px] border border-brass/60 bg-soot/95 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
              <p className="font-cormorant text-[clamp(1.1rem,2vw,1.4rem)] leading-relaxed text-bone">
                He was gone. I shall ever regard him as the best and wisest man whom I have ever
                known.
              </p>
              <div className="mx-auto mt-5 h-px w-12 bg-brass/70" aria-hidden="true" />
              <p className="mt-4 font-fell text-[0.7rem] tracking-[0.3em] text-brass">
                DR. JOHN WATSON — ON SHERLOCK HOLMES
              </p>
            </div>
          </div>
        </div>

        <IntertitlePlate
          numeral="V"
          title="THE FINAL PROBLEM"
          subtitle="In which the Napoleon of crime is met at the Reichenbach Falls."
        />
      </div>
    </section>
  );
}
