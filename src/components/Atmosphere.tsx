import type { CSSProperties } from 'react';

/** Fixed film-grain overlay — SVG feTurbulence tile, stepped at 8fps (§8.5). */
export function GrainOverlay({ opacity = 0.07 }: { opacity?: number }) {
  return <div className="grain-overlay" style={{ opacity }} aria-hidden="true" />;
}

/** Fixed vignette — deepens in the darker chapters (§8.6). */
export function Vignette({ opacity = 1 }: { opacity?: number }) {
  return <div className="vignette-overlay" style={{ opacity }} aria-hidden="true" />;
}

/**
 * Oversized blurred fog bank drifting across a stage (§8.3).
 * Variant 'a' drifts right, 'b' drifts left; rate sets the loop duration.
 */
export function FogBank({
  variant = 'a',
  duration = 60,
  opacity = 0.16,
  style,
  className = '',
}: {
  variant?: 'a' | 'b';
  duration?: number;
  opacity?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`fog-bank ${className}`}
      aria-hidden="true"
      style={{
        left: variant === 'a' ? '-25vw' : '-15vw',
        opacity,
        animation: `fog-drift-${variant} ${duration}s ease-in-out infinite alternate`,
        ...style,
      }}
    />
  );
}
