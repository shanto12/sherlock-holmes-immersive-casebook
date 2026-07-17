import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Hotspot — 10px brass pulsing dot over a scene detail (design.md §11).
 * Hover/tap/keyboard opens an annotation card (spring 260/22, slight tilt).
 * Parent manages which one is open (only one at a time).
 */
export default function Hotspot({
  x,
  y,
  title,
  body,
  open,
  onOpenChange,
  enterDelay = 0,
  cardSide = 'auto',
}: {
  /** position within the stage, e.g. '31%' */
  x: string;
  y: string;
  title: string;
  body: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** stagger delay (s) for the scale-in entrance */
  enterDelay?: number;
  cardSide?: 'auto' | 'left' | 'right';
}) {
  // Touch taps synthesize mouseenter before click — ignore the click that
  // immediately follows a hover-open so the card doesn't instantly close.
  const hoverOpenedAt = useRef(0);

  const xNum = parseFloat(x);
  const yNum = parseFloat(y);
  const side = cardSide === 'auto' ? (xNum > 62 ? 'left' : 'right') : cardSide;
  const below = yNum < 55;

  return (
    <div
      className="absolute z-20"
      style={{ left: x, top: y, animation: `hotspot-in 0.5s ease ${enterDelay}s both` }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Examine: ${title}`}
        data-cursor="EXAMINE"
        onMouseEnter={() => {
          if (!open) {
            hoverOpenedAt.current = Date.now();
            onOpenChange(true);
          }
        }}
        onClick={() => {
          if (open && Date.now() - hoverOpenedAt.current < 600) return;
          onOpenChange(!open);
        }}
        className="hotspot-ring relative block h-2.5 w-2.5 rounded-full bg-brass shadow-[0_0_10px_rgba(212,175,106,0.7)] transition-colors hover:bg-gilt focus-visible:bg-gilt"
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            exit={{ opacity: 0, y: 8, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className={`absolute z-30 w-[min(280px,74vw)] border border-brass/50 bg-soot/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-sm ${
              side === 'left' ? 'right-5' : 'left-5'
            } ${below ? 'top-4' : 'bottom-4'}`}
          >
            <p className="font-fell text-[0.72rem] tracking-[0.28em] text-brass">{title}</p>
            <p className="mt-2 font-cormorant text-[1.05rem] leading-snug text-bone-dim">{body}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
