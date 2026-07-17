import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Overture from '@/components/chapters/Overture';
import ChapterOne from '@/components/chapters/ChapterOne';
import ChapterTwo from '@/components/chapters/ChapterTwo';
import ChapterThree from '@/components/chapters/ChapterThree';
import ChapterFour from '@/components/chapters/ChapterFour';
import ChapterFive from '@/components/chapters/ChapterFive';
import ChapterSix from '@/components/chapters/ChapterSix';
import DialogueCaption from '@/components/DialogueCaption';
import Footer from '@/components/Footer';
import { AudioService } from '@/audio/AudioService';

gsap.registerPlugin(ScrollTrigger);

/** Whisper-subtle autoplay hint — never a button; fades on unlock, never returns. */
function AudioHint() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (AudioService.unlocked) return;
    const timer = window.setTimeout(() => {
      if (!AudioService.unlocked) setShow(true);
    }, 700);
    const off = AudioService.on('unlock', () => {
      setLeaving(true);
      window.setTimeout(() => setShow(false), 550);
    });
    return () => {
      window.clearTimeout(timer);
      off();
    };
  }, []);

  if (!show) return null;
  return (
    <p
      className={`pointer-events-none fixed inset-x-0 bottom-20 z-40 text-center font-fell text-[0.7rem] tracking-[0.3em] text-bone-dim transition-opacity duration-500 ${
        leaving ? 'opacity-0' : ''
      }`}
      style={leaving ? undefined : { animation: 'hint-pulse 2.4s ease-in-out infinite' }}
    >
      the story speaks — touch anywhere
    </p>
  );
}

/** Colophon: the fireplace bed tails to silence as it enters. */
function Colophon() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top 70%',
        onEnter: () => AudioService.setAmbience([], 3),
        onLeaveBack: () =>
          AudioService.setAmbience(
            [
              { name: 'amb_fireplace', gain: 0.16 },
              { name: 'sfx_violin', gain: 0.2 },
            ],
            1.5,
          ),
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref}>
      <Footer />
    </div>
  );
}

/**
 * THE JOURNEY — Overture + six pinned chapters + colophon (home.md).
 */
export default function Home() {
  return (
    <>
      <Overture />
      <ChapterOne />
      <ChapterTwo />
      <ChapterThree />
      <ChapterFour />
      <ChapterFive />
      <ChapterSix />
      <Colophon />
      <DialogueCaption />
      <AudioHint />
    </>
  );
}
