/**
 * Casebook archive data (casebook.md §2/§3) — the 14 voice clips grouped by
 * chapter and the 10 atmosphere tiles of the phonograph wall.
 * Transcripts themselves live in src/data/cues.ts (single source of truth);
 * `cueId` keys into CUES. In `quote`, *asterisks* mark the stressed word,
 * rendered upright inside the italic quote.
 */

import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightFromLine,
  Bell,
  CloudFog,
  CloudRain,
  Dog,
  Flame,
  Footprints,
  Music,
  Waves,
  Wind,
} from 'lucide-react';

export interface CaseClip {
  /** global archive index, 1–14 (shown on the wax seal) */
  index: number;
  /** audio filename without extension under /assets/audio/ */
  clip: string;
  /** key into CUES (src/data/cues.ts) for the full transcript */
  cueId: string;
  speaker: string;
  quote: string;
  source: string;
}

export interface ChapterGroup {
  numeral: string;
  title: string;
  clips: CaseClip[];
}

const STYLED = "styled after the novels' narration";

export const CHAPTER_GROUPS: ChapterGroup[] = [
  {
    numeral: 'I',
    title: 'Prologue — 221B Baker Street',
    clips: [
      {
        index: 1,
        clip: 'vo_prologue_watson',
        cueId: 'C-0',
        speaker: 'DR. JOHN WATSON',
        quote: 'The year is 1895…',
        source: STYLED,
      },
      {
        index: 2,
        clip: 'vo_holmes_greeting',
        cueId: 'C-1a',
        speaker: 'SHERLOCK HOLMES',
        quote: 'Come in, Watson — the game is afoot…',
        source: 'A Study in Scarlet, 1887',
      },
      {
        index: 3,
        clip: 'vo_mrs_hudson',
        cueId: 'C-1b',
        speaker: 'MRS. HUDSON',
        quote: 'That violin at three in the morning…',
        source: STYLED,
      },
    ],
  },
  {
    numeral: 'II',
    title: 'The Mind of Holmes',
    clips: [
      {
        index: 4,
        clip: 'vo_holmes_deduction',
        cueId: 'C-2ab',
        speaker: 'SHERLOCK HOLMES',
        quote: 'You see, but you do not observe…',
        source: 'A Scandal in Bohemia, 1891 / The Sign of Four, 1890',
      },
      {
        index: 5,
        clip: 'vo_lestrade',
        cueId: 'C-2c',
        speaker: 'INSPECTOR LESTRADE',
        quote: 'A locked room, Mr. Holmes…',
        source: STYLED,
      },
    ],
  },
  {
    numeral: 'III',
    title: 'A Scandal in Bohemia',
    clips: [
      {
        index: 6,
        clip: 'vo_watson_scandal',
        cueId: 'C-3a',
        speaker: 'DR. WATSON',
        quote: 'To Sherlock Holmes she is always *the* woman…',
        source: 'A Scandal in Bohemia, 1891',
      },
      {
        index: 7,
        clip: 'vo_irene',
        cueId: 'C-3b',
        speaker: 'IRENE ADLER',
        quote: 'I shall keep the photograph…',
        source: 'A Scandal in Bohemia, 1891',
      },
      {
        index: 8,
        clip: 'vo_holmes_scandal',
        cueId: 'C-3c',
        speaker: 'SHERLOCK HOLMES',
        quote: 'The best and wisest woman…',
        source: 'A Scandal in Bohemia, 1891',
      },
    ],
  },
  {
    numeral: 'IV',
    title: 'The Hound of the Baskervilles',
    clips: [
      {
        index: 9,
        clip: 'vo_watson_hound',
        cueId: 'C-4a',
        speaker: 'DR. WATSON',
        quote: 'An enormous, coal-black hound…',
        source: 'The Hound of the Baskervilles, 1902',
      },
      {
        index: 10,
        clip: 'vo_holmes_hound',
        cueId: 'C-4b',
        speaker: 'SHERLOCK HOLMES',
        quote: "The devil's agents may be of flesh and blood…",
        source: 'The Hound of the Baskervilles, 1902',
      },
    ],
  },
  {
    numeral: 'V',
    title: 'The Final Problem',
    clips: [
      {
        index: 11,
        clip: 'vo_moriarty',
        cueId: 'C-5a',
        speaker: 'PROF. MORIARTY',
        quote: 'You hope to place me in the dock…',
        source: 'The Final Problem, 1893',
      },
      {
        index: 12,
        clip: 'vo_holmes_final',
        cueId: 'C-5b',
        speaker: 'SHERLOCK HOLMES',
        quote: 'The Napoleon of crime…',
        source: 'The Final Problem, 1893',
      },
      {
        index: 13,
        clip: 'vo_watson_final',
        cueId: 'C-5c',
        speaker: 'DR. WATSON',
        quote: 'He was gone…',
        source: 'The Final Problem, 1893',
      },
    ],
  },
  {
    numeral: 'VI',
    title: 'Epilogue',
    clips: [
      {
        index: 14,
        clip: 'vo_holmes_epilogue',
        cueId: 'C-6',
        speaker: 'SHERLOCK HOLMES',
        quote: 'Elementary, my dear Watson…',
        source: 'styled after the canon',
      },
    ],
  },
];

export const ALL_CLIPS: CaseClip[] = CHAPTER_GROUPS.flatMap((g) => g.clips);

/* ---------------- Atmospheres (the phonograph wall) ---------------- */

export type AtmoKind = 'loop' | 'one-shot';

export interface AtmoTile {
  name: string;
  /** audio filename without extension under /assets/audio/ */
  file: string;
  kind: AtmoKind;
  icon: LucideIcon;
  /** spec default gain (casebook.md §3); slider default = defaultGain / MAX */
  defaultGain: number;
}

/** Sliders map 0–100 → gain 0–0.8 (casebook.md §3). */
export const ATMO_MAX_GAIN = 0.8;

export const ATMO_TILES: AtmoTile[] = [
  { name: 'Baker Street', file: 'amb_london_street', kind: 'loop', icon: CloudFog, defaultGain: 0.5 },
  { name: 'Rain at the Window', file: 'amb_rain_window', kind: 'loop', icon: CloudRain, defaultGain: 0.45 },
  { name: 'The Coal Fire', file: 'amb_fireplace', kind: 'loop', icon: Flame, defaultGain: 0.45 },
  { name: 'Wind on the Moor', file: 'amb_moor', kind: 'loop', icon: Wind, defaultGain: 0.5 },
  { name: 'The Falls', file: 'amb_waterfall', kind: 'loop', icon: Waves, defaultGain: 0.5 },
  { name: 'His Violin', file: 'sfx_violin', kind: 'loop', icon: Music, defaultGain: 0.4 },
  { name: 'Hansom at a Gallop', file: 'sfx_horse_gallop', kind: 'one-shot', icon: ArrowRightFromLine, defaultGain: 0.6 },
  { name: 'The Hound', file: 'sfx_hound_howl', kind: 'one-shot', icon: Dog, defaultGain: 0.6 },
  { name: 'Boots on Cobbles', file: 'sfx_footsteps', kind: 'one-shot', icon: Footprints, defaultGain: 0.55 },
  { name: 'The Midnight Bell', file: 'sfx_clock_bell', kind: 'one-shot', icon: Bell, defaultGain: 0.6 },
];

/** Default slider position (0–100) for a tile's spec default gain. */
export function defaultSlider(tile: AtmoTile): number {
  return Math.round((tile.defaultGain / ATMO_MAX_GAIN) * 100);
}
