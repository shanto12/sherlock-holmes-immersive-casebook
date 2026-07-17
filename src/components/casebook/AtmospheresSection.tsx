/**
 * Atmospheres (casebook.md §3) — the phonograph wall. Ten tiles styled as
 * archive boxes: icon plate (wobbles like a spinning cylinder with animated
 * sound arcs while playing), name, LOOP / ONE-SHOT chip, and a brass shadcn
 * Slider (0–100 → gain 0–0.8). Clicking the tile body starts/stops the sound;
 * loops layer together on the ambience bus, one-shots replay per click.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ATMO_TILES } from './archive-data';
import type { AtmoTile, AtmoKind } from './archive-data';
import type { AtmospherePlayer } from './useCasebookAudio';

const KIND_LABEL: Record<AtmoKind, string> = { loop: 'LOOP', 'one-shot': 'ONE-SHOT' };

/** Brass restyle of the shadcn Slider via its data slots. */
const SLIDER_CLASSES = cn(
  '[&_[data-slot=slider-track]]:h-[3px] [&_[data-slot=slider-track]]:bg-umber',
  '[&_[data-slot=slider-range]]:bg-brass',
  '[&_[data-slot=slider-thumb]]:size-3.5 [&_[data-slot=slider-thumb]]:border-brass [&_[data-slot=slider-thumb]]:bg-brass [&_[data-slot=slider-thumb]]:shadow-none',
  '[&_[data-slot=slider-thumb]]:transition-[box-shadow] [&_[data-slot=slider-thumb]]:hover:ring-2 [&_[data-slot=slider-thumb]]:hover:ring-gilt/60',
);

/** 48px icon plate: 3° cylinder wobble + two staggered sound arcs while on. */
const IconPlate = memo(function IconPlate({ on, icon: Icon }: { on: boolean; icon: LucideIcon }) {
  return (
    <div
      className={cn(
        'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition-colors duration-300',
        on ? 'border-gilt/70 bg-pipe-brown' : 'border-brass/50 bg-pipe-brown/60',
      )}
    >
      <motion.div
        animate={on ? { rotate: [0, 3, 0, -3, 0] } : { rotate: 0 }}
        transition={on ? { duration: 2, repeat: Infinity, ease: 'linear' } : { duration: 0.2 }}
        className="flex"
      >
        <Icon className={cn('h-5 w-5', on ? 'text-gilt' : 'text-brass')} strokeWidth={1.5} aria-hidden="true" />
      </motion.div>
      {on && (
        <svg
          className="absolute -right-3.5 top-1/2 -translate-y-1/2"
          width="12"
          height="20"
          viewBox="0 0 12 20"
          aria-hidden="true"
        >
          {['M2 6.5 Q6 10 2 13.5', 'M2 3 Q10.5 10 2 17'].map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              stroke="#D4AF6A"
              strokeWidth="1"
              strokeLinecap="round"
              initial={{ opacity: 0.15 }}
              animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.92, 1.06, 0.92] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.5 }}
              style={{ transformOrigin: 'left center' }}
            />
          ))}
        </svg>
      )}
    </div>
  );
});

interface TileProps {
  tile: AtmoTile;
  order: number;
  atmo: AtmospherePlayer;
}

function AtmosphereTile({ tile, order, atmo }: TileProps) {
  const on = Boolean(atmo.on[tile.file]);
  const vol = atmo.vol[tile.file] ?? 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay: order * 0.05, ease: [0.16, 1, 0.3, 1] }}
      role="button"
      tabIndex={0}
      aria-pressed={on}
      aria-label={`${tile.name} — ${KIND_LABEL[tile.kind].toLowerCase()}`}
      data-cursor="LISTEN"
      onClick={() => atmo.toggle(tile.file)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          atmo.toggle(tile.file);
        }
      }}
      className={cn(
        'group cursor-pointer select-none rounded-[1.5px] border bg-soot p-5 transition-[border-color,box-shadow] duration-300',
        on ? 'border-brass shadow-[0_12px_40px_rgba(0,0,0,0.5)]' : 'border-umber hover:border-brass/60',
      )}
    >
      <div className="flex items-center gap-4 pr-2">
        <IconPlate on={on} icon={tile.icon} />
        <div className="min-w-0">
          <p className="font-fell text-[0.75rem] leading-snug tracking-[0.2em] text-bone">
            {tile.name.toUpperCase()}
          </p>
          <span
            className={cn(
              'mt-1.5 inline-block rounded-full border px-2 py-px font-fell text-[0.65rem] tracking-[0.14em]',
              on ? 'border-gilt/50 text-gilt' : 'border-fog/40 text-fog',
            )}
          >
            {KIND_LABEL[tile.kind]}
          </span>
        </div>
      </div>

      {/* volume — hover-revealed on fine pointers, always shown on touch */}
      <div
        className="mt-5 opacity-100 transition-opacity duration-300 [@media(pointer:fine)]:opacity-0 [@media(pointer:fine)]:focus-within:opacity-100 [@media(pointer:fine)]:group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Slider
          value={[vol]}
          onValueChange={([v]) => atmo.setVolume(tile.file, v)}
          min={0}
          max={100}
          step={1}
          aria-label={`${tile.name} volume`}
          className={SLIDER_CLASSES}
        />
      </div>
    </motion.div>
  );
}

export default function AtmospheresSection({ atmo }: { atmo: AtmospherePlayer }) {
  return (
    <section aria-label="Atmospheres" className="mx-auto w-[min(1120px,92vw)] pb-24 pt-14 sm:pt-20">
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-playfair text-[clamp(1.8rem,4vw,3rem)] font-extrabold text-bone">
          ATMOSPHERES
        </h2>
        <p className="mt-3 font-cormorant text-[1.1rem] italic leading-relaxed text-bone-dim">
          Wind up the phonograph — layer the sounds of his London.
        </p>
      </motion.header>

      <div className="mt-10 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {ATMO_TILES.map((tile, i) => (
          <AtmosphereTile key={tile.file} tile={tile} order={i} atmo={atmo} />
        ))}
      </div>
    </section>
  );
}
