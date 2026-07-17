import { forwardRef } from 'react';

/**
 * Silent-film intertitle plate (design.md §9).
 * Full-stage soot plate in two halves so the exit can split it apart
 * vertically (top y:-102%, bottom y:102%). The parent chapter's GSAP
 * timeline animates `.intertitle` (flicker-in) and the two halves (split).
 */
const IntertitlePlate = forwardRef<
  HTMLDivElement,
  { numeral: string; eyebrow?: string; title: string; subtitle: string }
>(function IntertitlePlate({ numeral, eyebrow, title, subtitle }, ref) {
  const content = (
    <div className="relative flex h-full w-full items-center justify-center bg-soot/95">
      {/* giant outlined numeral behind the card */}
      <span
        aria-hidden="true"
        className="chapter-numeral pointer-events-none absolute select-none text-[clamp(8rem,22vw,20rem)]"
      >
        {numeral}
      </span>
      <div className="intertitle-border relative bg-soot/80 px-8 py-10 text-center sm:px-14 sm:py-12">
        <p className="font-fell text-[0.72rem] tracking-[0.32em] text-brass">{eyebrow ?? numeral}</p>
        <h2 className="mt-4 font-fell text-[clamp(1.4rem,2.2vw,2.2rem)] tracking-[0.14em] text-bone">
          {title}
        </h2>
        <div className="mx-auto mt-5 h-px w-16 bg-brass/70" aria-hidden="true" />
        <p className="mx-auto mt-5 max-w-[34ch] font-cormorant text-[clamp(1rem,1.6vw,1.25rem)] italic leading-relaxed text-bone-dim">
          {subtitle}
        </p>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="intertitle pointer-events-none absolute inset-0 z-20 opacity-0">
      <div className="intertitle-half-top absolute inset-x-0 top-0 h-1/2 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[200%]">{content}</div>
      </div>
      <div className="intertitle-half-bottom absolute inset-x-0 bottom-0 h-1/2 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-[200%]">{content}</div>
      </div>
    </div>
  );
});

export default IntertitlePlate;
