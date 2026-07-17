/**
 * Caption cue sheets (home.md) — every voice clip's full transcript.
 * `clip` is the audio filename without extension under /assets/audio/.
 * `trigger` is the chapter-progress threshold at which the cue fires.
 * Typing rate is derived at runtime from the decoded buffer duration;
 * silent fallback is 55 chars/sec.
 */

export interface CaptionCue {
  id: string;
  speaker: string;
  lines: string[];
  clip: string;
}

export const CUES: Record<string, CaptionCue> = {
  'C-0': {
    id: 'C-0',
    speaker: 'DR. JOHN WATSON',
    clip: 'vo_prologue_watson',
    lines: [
      'The year is 1895, and the fog lies upon Baker Street like a curtain upon the stage.',
      'Of all the cases my friend Mr. Sherlock Holmes and I have shared, it is here — at 221B — that every story begins.',
      'I am Dr. John Watson. These are the records of the most singular mind I have ever known.',
    ],
  },
  'C-1a': {
    id: 'C-1a',
    speaker: 'SHERLOCK HOLMES',
    clip: 'vo_holmes_greeting',
    lines: [
      'Come in, Watson, come in — the game is afoot!',
      'You have been in Afghanistan, I perceive.',
    ],
  },
  'C-1b': {
    id: 'C-1b',
    speaker: 'MRS. HUDSON',
    clip: 'vo_mrs_hudson',
    lines: [
      'Mr. Holmes! That violin at three in the morning — the whole street hears it, sir.',
      "And there's a lady waiting in the sitting room. A very particular lady.",
    ],
  },
  'C-2ab': {
    id: 'C-2ab',
    speaker: 'SHERLOCK HOLMES',
    clip: 'vo_holmes_deduction',
    lines: [
      'You see, but you do not observe. The distinction is clear.',
      'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    ],
  },
  'C-2c': {
    id: 'C-2c',
    speaker: 'INSPECTOR LESTRADE — SCOTLAND YARD',
    clip: 'vo_lestrade',
    lines: [
      'A locked room, Mr. Holmes. No weapon, no window forced — no way in, and no way out.',
      "Scotland Yard is beaten, and I'll not pretend otherwise.",
    ],
  },
  'C-3a': {
    id: 'C-3a',
    speaker: 'DR. JOHN WATSON',
    clip: 'vo_watson_scandal',
    lines: [
      'To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name.',
    ],
  },
  'C-3b': {
    id: 'C-3b',
    speaker: 'IRENE ADLER',
    clip: 'vo_irene',
    lines: [
      'You may tell the King that I shall keep the photograph — only as a safeguard for my own future.',
      'Good night, Mr. Sherlock Holmes.',
    ],
  },
  'C-3c': {
    id: 'C-3c',
    speaker: 'SHERLOCK HOLMES',
    clip: 'vo_holmes_scandal',
    lines: ['The best and wisest woman I have ever known.'],
  },
  'C-4a': {
    id: 'C-4a',
    speaker: 'DR. JOHN WATSON',
    clip: 'vo_watson_hound',
    lines: [
      'A hound it was — an enormous, coal-black hound, fire bursting from its open mouth, its eyes glowing with a smouldering glare.',
    ],
  },
  'C-4b': {
    id: 'C-4b',
    speaker: 'SHERLOCK HOLMES',
    clip: 'vo_holmes_hound',
    lines: [
      "The devil's agents may be of flesh and blood, may they not?",
      'Steady, Watson — steady… THE HOUND!',
    ],
  },
  'C-5a': {
    id: 'C-5a',
    speaker: 'PROFESSOR JAMES MORIARTY',
    clip: 'vo_moriarty',
    lines: [
      'You hope to place me in the dock, Mr. Holmes.',
      'Danger is part of my trade — but I assure you, it will end in your destruction.',
    ],
  },
  'C-5b': {
    id: 'C-5b',
    speaker: 'SHERLOCK HOLMES',
    clip: 'vo_holmes_final',
    lines: [
      'He is the Napoleon of crime, Watson. He sits motionless, like a spider in the centre of its web.',
    ],
  },
  'C-5c': {
    id: 'C-5c',
    speaker: 'DR. JOHN WATSON',
    clip: 'vo_watson_final',
    lines: [
      'He was gone.',
      'I shall ever regard him as the best and wisest man whom I have ever known.',
    ],
  },
  'C-6': {
    id: 'C-6',
    speaker: 'SHERLOCK HOLMES',
    clip: 'vo_holmes_epilogue',
    lines: ['Elementary, my dear Watson. Elementary.', 'The game, as ever, is afoot.'],
  },
};

/** Audio clips each chapter should have decoded (itself + one chapter ahead). */
export const CHAPTER_AUDIO: string[][] = [
  // 0 — Overture
  ['amb_london_street', 'sfx_clock_bell', 'vo_prologue_watson'],
  // I — 221B Baker Street
  ['vo_holmes_greeting', 'vo_mrs_hudson', 'sfx_footsteps', 'amb_london_street'],
  // II — The Mind of Holmes
  ['vo_holmes_deduction', 'vo_lestrade', 'sfx_violin', 'amb_fireplace', 'amb_rain_window'],
  // III — A Scandal in Bohemia
  ['vo_watson_scandal', 'vo_irene', 'vo_holmes_scandal', 'sfx_horse_gallop', 'amb_london_street', 'amb_rain_window'],
  // IV — The Hound of the Baskervilles
  ['vo_watson_hound', 'vo_holmes_hound', 'sfx_hound_howl', 'amb_moor'],
  // V — The Final Problem
  ['vo_moriarty', 'vo_holmes_final', 'vo_watson_final', 'amb_waterfall'],
  // VI — Epilogue
  ['vo_holmes_epilogue', 'amb_fireplace', 'sfx_violin'],
];
