import type { ReactNode } from 'react';
import HUD from '@/components/HUD';
import Cursor from '@/components/Cursor';
import { GrainOverlay, Vignette } from '@/components/Atmosphere';

/**
 * Layout — fixed chrome + atmosphere, no navbar, NO top padding:
 * the home journey is full-bleed; the Casebook page handles its own spacing.
 * Children pattern: Layout wraps <Routes> in App.tsx.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-ink text-bone">
      <HUD />
      <Cursor />
      <main>{children}</main>
      <GrainOverlay />
      <Vignette />
    </div>
  );
}
