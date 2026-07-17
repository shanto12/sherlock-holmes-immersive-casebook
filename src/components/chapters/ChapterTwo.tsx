import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AudioService } from '@/audio/AudioService';
import { useCaptions, useCueFirer } from '@/data/CaptionContext';
import { CUES, CHAPTER_AUDIO } from '@/data/cues';
import IntertitlePlate from '@/components/IntertitlePlate';
import ParticleCanvas from '@/components/ParticleCanvas';
import Hotspot from '@/components/Hotspot';
import ClueCard from '@/components/ClueCard';
import { FULL_BLEED_IMG, KB, SCRUB, intertitleFlicker, splitOut, useOneShots } from './shared';

gsap.registerPlugin(ScrollTrigger);

const BED = [
  { name: 'amb_fireplace', gain: 0.25 },
  { name: 'amb_rain_window', gain: 0.13 },
];
const NEXT_BED = [
  { name: 'amb_london_street', gain: 0.25 },
  { name: 'amb_rain_window', gain: 0.1 },
];

const HOTSPOTS = [
  {
    id: 'violin',
    x: '31%',
    y: '58%',
    title: 'THE VIOLIN',
    body: 'A Stradivarius, purchased for fifty-five shillings from a Jewish broker in the Tottenham Court Road. He plays when he thinks — and the thinking is often dark.',
  },
  {
    id: 'chemistry',
    x: '68%',
    y: '52%',
    title: 'THE CHEMISTRY TABLE',
    body: 'Acid-stained and littered with retorts. Here were written monographs upon the ashes of one hundred and forty varieties of tobacco.',
  },
  {
    id: 'slipper',
    x: '52%',
    y: '74%',
    title: 'THE PERSIAN SLIPPER',
    body: 'Where he keeps his tobacco, upon the mantel. Watson has long since stopped objecting.',
  },
  {
    id: 'vr',
    x: '84%',
    y: '30%',
    title: 'V.R. IN BULLET-POCKS',
    body: 'Victoria Regina, done in bullet-pocks upon the wall. A patriotic decoration, fired from the armchair.',
  },
];

const CLUES = [
  { front: 'A MUDDY BOOT', back: 'The mud is London clay mixed with chalk — he walked here from the Kent line, and in haste.' },
  { front: 'A SPLINTERED LOCK', back: 'Forced from within. The burglar was already in the house — as the burglar always is.' },
  { front: 'BITTER ALMONDS', back: 'Prussic acid. The room smelled of it, yet no glass was found. Look to the candle.' },
  { front: 'A TICKET STUB — THE OPERA', back: 'Torn, but the seat remains: a box no clerk could afford. Our man has a patron.' },
];

const QUOTE_1 = 'You see, but you do not observe. The distinction is clear.';
const QUOTE_2 = 'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.';

/**
 * CHAPTER II — THE MIND OF HOLMES (640vh).
 * Sitting-room hotspots → silhouette monologue → the deduction board.
 */
export default function ChapterTwo() {
  const sectionRef = useRef<HTMLElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const { clear } = useCaptions();
  const [hotspotsOn, setHotspotsOn] = useState(false);
  const [cardsOn, setCardsOn] = useState(false);
  const [openHotspot, setOpenHotspot] = useState<string | null>(null);
  const [labelHidden, setLabelHidden] = useState(false);
  const [finePointer] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
  );

  const fireCues = useCueFirer([{ cue: CUES['C-2c'], trigger: 0.8 }]);
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
              { id: 'hotspots', at: 0.14, fn: () => setHotspotsOn(true) },
              { id: 'violin', at: 0.18, fn: () => AudioService.playSfx('sfx_violin', { gain: 0.16 }) },
              { id: 'deduction-vo', at: 0.5, fn: () => AudioService.playDialogue('vo_holmes_deduction') },
              { id: 'cards', at: 0.74, fn: () => setCardsOn(true) },
              { id: 'bed', at: 0.92, fn: () => AudioService.setAmbience(NEXT_BED, 1.5) },
            ]);
          },
        },
      });

      /* ---- II-A: the sitting room (0–40) ---- */
      splitOut(tl, root, 10);
      tl.fromTo(q('.room-img'), KB.pull.from, { ...KB.pull.to, duration: 40, ease: 'none' }, 0);
      // hand off the room to the monologue stage
      tl.to(q('.room-stage'), { autoAlpha: 0, duration: 6, ease: 'none' }, 40);

      /* ---- II-B: the silhouette monologue (40–70) ---- */
      tl.fromTo(
        q('.mono-stage'),
        { autoAlpha: 0, x: -60 },
        { autoAlpha: 1, x: 0, duration: 8, ease: 'none' },
        40,
      );
      // word-level quote reveal, scrubbed 48→66 (reading pace = scroll pace)
      tl.fromTo(
        q('.qw'),
        { opacity: 0.12 },
        { opacity: 1, duration: 2, stagger: { amount: 16 }, ease: 'none' },
        48,
      );
      tl.to(q('.qw2'), { color: '#E9DFC9', duration: 4, ease: 'none' }, 64);
      // monologue stage yields to the board
      tl.to(q('.mono-stage'), { autoAlpha: 0, duration: 4, ease: 'none' }, 68);

      /* ---- II-C: the deduction board (70–100) ---- */
      tl.fromTo(q('.board-stage'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 6, ease: 'none' }, 70);
      tl.fromTo(q('.thread'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 14, ease: 'none', stagger: 0 }, 78);
      tl.fromTo(q('.conclusion'), { boxShadow: '0 0 0 rgba(212,175,106,0)', borderColor: 'rgba(176,141,76,0.25)' }, { boxShadow: '0 0 28px rgba(212,175,106,0.35)', borderColor: 'rgba(212,175,106,1)', duration: 4 }, 90);
      // exit: board dims for the fog wipe of Chapter III
      tl.to(q('.board-stage'), { opacity: 0.15, duration: 4, ease: 'none' }, 96);

      ScrollTrigger.create({
        trigger: root,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => {
          intertitleFlicker(root.querySelector('.intertitle'));
          clear();
          AudioService.setAmbience(BED, 1.5);
          void AudioService.preload(CHAPTER_AUDIO[3]);
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
    <section ref={sectionRef} id="chapter-2" className="relative" style={{ height: '640vh' }} aria-label="Chapter II — The Mind of Holmes">
      <div className="sticky top-0 h-[100dvh] overflow-hidden bg-ink">
        {/* ---------- II-A: the sitting room ---------- */}
        <div className="room-stage absolute inset-0">
          <img
            src="/assets/img/sitting_room.jpg"
            alt="The 221B sitting room — coal fire, violin, chemistry table"
            loading="lazy"
            className={`room-img ${FULL_BLEED_IMG}`}
          />
          {/* breathing hearth warmth */}
          <div
            className="pointer-events-none absolute left-[38%] top-[62%] h-[36vh] w-[30vw]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212,175,106,0.9), transparent 70%)',
              animation: 'fire-breathe 3s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          <ParticleCanvas kind="rain" count={60} slantDeg={4} />

          {hotspotsOn &&
            HOTSPOTS.map((h, i) => (
              <Hotspot
                key={h.id}
                x={h.x}
                y={h.y}
                title={h.title}
                body={h.body}
                enterDelay={i * 0.15}
                open={openHotspot === h.id}
                onOpenChange={(open) => {
                  setOpenHotspot(open ? h.id : null);
                  if (open) setLabelHidden(true);
                }}
              />
            ))}

          <p
            className={`absolute bottom-8 right-8 font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim transition-opacity duration-700 ${
              labelHidden ? 'opacity-0' : 'opacity-100'
            }`}
          >
            THE SITTING ROOM — EXAMINE THE EVIDENCE
          </p>
        </div>

        {/* ---------- II-B: the silhouette monologue ---------- */}
        <div className="mono-stage absolute inset-0 flex flex-col opacity-0 md:flex-row">
          <div className="relative h-[45vh] w-full overflow-hidden md:h-full md:w-[42%]">
            <img
              src="/assets/img/holmes_silhouette.jpg"
              alt="Holmes in profile, pipe smoke curling, backlit by fog"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ animation: 'drift-kb 26s ease-in-out infinite' }}
            />
            <div className="pointer-events-none absolute inset-3 border border-brass/40" aria-hidden="true" />
            {/* pipe smoke */}
            <div
              className="pointer-events-none absolute left-[55%] top-[45%] h-10 w-10 rounded-full bg-fog/30 blur-md"
              style={{ animation: 'smoke-rise 7s ease-out infinite' }}
              aria-hidden="true"
            />
          </div>
          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-soot px-6 py-10 md:px-14">
            <span aria-hidden="true" className="chapter-numeral pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-[clamp(8rem,22vw,20rem)]">
              II
            </span>
            <div className="relative max-w-[30ch]">
              <p className="font-fell text-[0.72rem] tracking-[0.32em] text-brass">
                SHERLOCK HOLMES — TO DR. WATSON
              </p>
              <p className="mt-6 font-cormorant font-semibold italic leading-[1.3] text-bone" style={{ fontSize: 'clamp(1.6rem,3.4vw,3rem)' }}>
                {QUOTE_1.split(' ').map((w, i) => (
                  <span key={i} className="qw inline-block opacity-[0.12]">
                    {w}&nbsp;
                  </span>
                ))}
              </p>
              <p className="mt-6 font-cormorant font-semibold italic leading-[1.3] text-bone-dim" style={{ fontSize: 'clamp(1.3rem,2.6vw,2.2rem)' }}>
                {QUOTE_2.split(' ').map((w, i) => (
                  <span key={i} className="qw qw2 inline-block opacity-[0.12]">
                    {w}&nbsp;
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        {/* ---------- II-C: the deduction board ---------- */}
        <div className="board-stage absolute inset-0 flex flex-col-reverse opacity-0 md:flex-row">
          {/* board */}
          <div className="relative flex flex-1 flex-col justify-center bg-soot px-5 py-8 md:w-[60%] md:px-12">
            <p className="font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim">
              A CASE IN FOUR CLUES — TURN THEM OVER
            </p>
            <div className="relative mt-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {CLUES.map((c, i) => (
                  <div key={c.front} style={cardsOn ? { animation: `card-in 0.6s ease ${i * 0.12}s both` } : { opacity: 0 }}>
                    <ClueCard front={c.front} back={c.back} />
                  </div>
                ))}
              </div>
              {/* threads to the conclusion */}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {[
                  'M25 20 Q40 55 50 82',
                  'M75 20 Q60 55 50 82',
                  'M25 55 Q38 70 50 82',
                  'M75 55 Q62 70 50 82',
                ].map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1}
                    className="thread"
                    fill="none"
                    stroke="#8D9BA6"
                    strokeOpacity="0.5"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              <div className="conclusion mx-auto mt-6 w-fit border px-6 py-3" style={{ borderColor: 'rgba(176,141,76,0.25)' }}>
                <p className="font-fell text-[0.85rem] tracking-[0.24em] text-gilt">
                  THE IMPOSSIBLE, ELIMINATED.
                </p>
              </div>
            </div>
          </div>
          {/* portrait with cursor spotlight */}
          <div
            ref={spotRef}
            className="relative h-[40vh] w-full overflow-hidden md:h-full md:w-[40%]"
            onMouseMove={(e) => {
              const el = spotRef.current;
              if (!el) return;
              const r = el.getBoundingClientRect();
              el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`);
              el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`);
            }}
          >
            <img
              src="/assets/img/holmes_deduction.jpg"
              alt="Holmes bent over a clue with a magnifying glass"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ filter: finePointer ? 'brightness(0.5)' : 'brightness(0.75)' }}
            />
            {finePointer && (
              <img
                src="/assets/img/holmes_deduction.jpg"
                alt=""
                loading="lazy"
                aria-hidden="true"
                className="cursor-spotlight absolute inset-0 h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        <IntertitlePlate
          numeral="II"
          title="THE MIND OF HOLMES"
          subtitle="In which the violin weeps at three o'clock, and the mind dissects the obvious."
        />
      </div>
    </section>
  );
}
