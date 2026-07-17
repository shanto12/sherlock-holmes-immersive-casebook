import { useState } from 'react';

/**
 * ClueCard — 3D flip card (design.md §11): front = evidence name,
 * back = Holmes' observation. rotateY 180° on hover/tap, Enter/Space flips.
 */
export default function ClueCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <button
      type="button"
      data-cursor="EXAMINE"
      aria-pressed={flipped}
      aria-label={`Clue: ${front}. Activate to reveal the deduction.`}
      onClick={() => setFlipped((f) => !f)}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      className="group relative block min-h-[140px] w-full text-left [perspective:900px]"
    >
      <span
        className="preserve-3d absolute inset-0 block transition-transform duration-700 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* front — evidence name */}
        <span className="backface-hidden absolute inset-0 flex items-center justify-center border border-umber bg-soot/90 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-colors group-hover:border-brass/60">
          <span className="text-center font-fell text-[0.85rem] tracking-[0.22em] text-bone">
            {front}
          </span>
        </span>
        {/* back — the deduction */}
        <span
          className="backface-hidden absolute inset-0 flex items-center border border-brass/50 bg-soot p-4 pl-5"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <span className="absolute inset-y-3 left-2 w-px bg-brass/70" aria-hidden="true" />
          <span className="font-cormorant text-[0.95rem] italic leading-snug text-bone-dim">
            {back}
          </span>
        </span>
      </span>
      {/* spacer so the button keeps its size */}
      <span className="invisible block min-h-[140px] p-4">{front}</span>
    </button>
  );
}
