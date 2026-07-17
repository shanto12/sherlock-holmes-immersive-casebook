/**
 * AudioService — the 3-bus Web Audio engine (design.md §10).
 *
 *   Sources ── AmbienceBus (loops, crossfading per chapter)
 *           ── SfxBus (one-shots: bell, gallop, howl…)
 *           ── DialogueBus (one-shots, priority)
 *   All ──→ MasterBus → DynamicsCompressor → destination
 *
 * - Sidechain-style ducking: dialogue drops ambience −6dB (×0.5), sfx −3dB (×0.708).
 * - Chapter ambience crossfades via setAmbience().
 * - No-button autoplay: attempts immediate resume on init; first pointer/key/wheel
 *   event unlocks the context and the overture (re)starts from 0.
 * - HUD mute ramps MasterBus 0/1 over 400ms and persists to localStorage.
 * - Tab hidden suspends the context; visible resumes if it was playing.
 *
 * Reusable singleton — the Casebook page reuses it for clips + atmospheres.
 */

const AUDIO_BASE = '/assets/audio/';
const MUTE_KEY = 'sh-muted';

export interface LoopSpec {
  name: string;
  gain: number;
  /** optional low-pass cutoff in Hz (e.g. the moor wind "distance") */
  filterFreq?: number;
}

export interface SfxOptions {
  gain?: number;
  pan?: number;
  /** automate pan toward this value across the clip (approach feel) */
  panTo?: number;
  /** add a 120ms feedback-delay send (reverb-ish, first howl) */
  echo?: boolean;
  when?: number;
}

export interface DialogueOptions {
  gain?: number;
  onEnd?: () => void;
}

interface ActiveLoop {
  src: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode | null;
  name: string;
}

interface ActiveDialogue {
  src: AudioBufferSourceNode;
  gain: GainNode;
  name: string;
  startedAt: number;
  duration: number;
  onEnd?: () => void;
}

type EventName = 'unlock' | 'mute' | 'dialogueend';
type Listener = (payload?: unknown) => void;

class AudioServiceImpl {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private compressor!: DynamicsCompressorNode;
  private ambienceBus!: GainNode;
  private sfxBus!: GainNode;
  private dialogueBus!: GainNode;

  private buffers = new Map<string, AudioBuffer>();
  private bufferOrder: string[] = [];
  private pending = new Map<string, Promise<AudioBuffer | null>>();
  private loops = new Map<string, ActiveLoop>();
  private dialogue: ActiveDialogue | null = null;

  private listeners = new Map<EventName, Set<Listener>>();
  private unlockListenersAttached = false;
  private overtureStarted = false;
  private wasRunningBeforeHidden = false;

  unlocked = false;
  muted = false;

  /* ---------------- events ---------------- */

  on(event: EventName, cb: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private emit(event: EventName, payload?: unknown) {
    this.listeners.get(event)?.forEach((cb) => cb(payload));
  }

  /* ---------------- lifecycle ---------------- */

  /** Create the graph, attempt immediate autoplay, arm the first-interaction unlock. */
  init() {
    if (this.ctx) return;
    const Ctor: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    const ctx = new Ctor();
    this.ctx = ctx;

    this.muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -18;
    this.compressor.knee.value = 24;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.24;

    this.ambienceBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.dialogueBus = ctx.createGain();

    this.ambienceBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.dialogueBus.connect(this.master);
    this.master.connect(this.compressor);
    this.compressor.connect(ctx.destination);

    // Preload the Overture so playback can start the instant we are allowed.
    void this.preload(['amb_london_street', 'sfx_clock_bell', 'vo_prologue_watson']);

    // Attempt immediate autoplay.
    void ctx.resume().then(() => {
      if (ctx.state === 'running') this.handleUnlock();
    });
    // Some engines need a tick before state settles.
    window.setTimeout(() => {
      if (this.ctx && this.ctx.state === 'running' && !this.unlocked) this.handleUnlock();
    }, 350);

    ctx.addEventListener('statechange', () => {
      if (ctx.state === 'running' && !this.unlocked) this.handleUnlock();
    });

    // First-interaction unlock: resume + restart the prologue from 0.
    if (!this.unlockListenersAttached) {
      this.unlockListenersAttached = true;
      const handler = () => {
        ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((t) =>
          window.removeEventListener(t, handler, { capture: true } as EventListenerOptions),
        );
        void this.ctx?.resume().then(() => this.handleUnlock());
      };
      ['pointerdown', 'touchstart', 'keydown', 'wheel'].forEach((t) =>
        window.addEventListener(t, handler, { capture: true, passive: true }),
      );
    }

    // Pause all buses when the tab hides; resume on return if we were playing.
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        this.wasRunningBeforeHidden = this.ctx.state === 'running';
        if (this.wasRunningBeforeHidden) void this.ctx.suspend();
      } else if (this.wasRunningBeforeHidden && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    });
  }

  private handleUnlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.emit('unlock');
    this.startOverture();
  }

  /** Bell → street bed → Watson's prologue, always from 0. */
  private startOverture() {
    if (this.overtureStarted || !this.ctx) return;
    this.overtureStarted = true;
    const t0 = this.ctx.currentTime;
    this.playSfx('sfx_clock_bell', { gain: 0.5, when: t0 + 0.3 });
    this.setAmbience([{ name: 'amb_london_street', gain: 0.2 }], 2);
    window.setTimeout(() => {
      this.playDialogue('vo_prologue_watson', { gain: 0.9 });
    }, 900);
  }

  get state(): AudioContextState | 'uninitialized' {
    return this.ctx ? this.ctx.state : 'uninitialized';
  }

  /* ---------------- decoding ---------------- */

  /** Fire-and-forget decode of a set of clips (one chapter ahead). */
  preload(names: string[]): Promise<unknown> {
    return Promise.all(names.map((n) => this.loadBuffer(n)));
  }

  loadBuffer(name: string): Promise<AudioBuffer | null> {
    if (this.buffers.has(name)) return Promise.resolve(this.buffers.get(name)!);
    if (this.pending.has(name)) return this.pending.get(name)!;
    if (!this.ctx) return Promise.resolve(null);
    const ctx = this.ctx;
    const p = fetch(`${AUDIO_BASE}${name}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`audio ${name}: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((ab) => ctx.decodeAudioData(ab))
      .then((buf) => {
        this.buffers.set(name, buf);
        this.bufferOrder.push(name);
        this.evictIfNeeded();
        return buf;
      })
      .catch(() => null)
      .finally(() => this.pending.delete(name));
    this.pending.set(name, p);
    return p;
  }

  /** Keep the decoded set bounded (design.md §14). */
  private evictIfNeeded() {
    const MAX = 12;
    while (this.bufferOrder.length > MAX) {
      const oldest = this.bufferOrder[0];
      if (this.loops.has(oldest) || this.dialogue?.name === oldest) {
        this.bufferOrder.push(this.bufferOrder.shift()!);
        if (this.bufferOrder.length <= MAX) break;
        continue;
      }
      this.bufferOrder.shift();
      this.buffers.delete(oldest);
    }
  }

  getDuration(name: string): number | null {
    return this.buffers.get(name)?.duration ?? null;
  }

  /* ---------------- buses / ducking ---------------- */

  private ramp(param: AudioParam, value: number, time: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + time);
  }

  private duck() {
    this.ramp(this.ambienceBus.gain, 0.5, 0.3);
    this.ramp(this.sfxBus.gain, 0.708, 0.3);
  }

  private releaseDuck() {
    this.ramp(this.ambienceBus.gain, 1, 0.8);
    this.ramp(this.sfxBus.gain, 1, 0.8);
  }

  /** The Reichenbach silence beat: everything to −∞, hold, restore. */
  silenceBeat(holdSeconds = 1.2) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const bus of [this.ambienceBus, this.sfxBus, this.dialogueBus]) {
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      bus.gain.setValueAtTime(0.0001, now + 0.4 + holdSeconds);
      bus.gain.linearRampToValueAtTime(1, now + 0.8 + holdSeconds);
    }
  }

  /* ---------------- one-shots ---------------- */

  playSfx(name: string, opts: SfxOptions = {}) {
    if (!this.ctx) return;
    void this.loadBuffer(name).then((buf) => {
      if (!buf || !this.ctx) return;
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = opts.gain ?? 0.5;
      let tail: AudioNode = g;

      if (opts.pan !== undefined || opts.panTo !== undefined) {
        const panner = ctx.createStereoPanner();
        panner.pan.value = opts.pan ?? 0;
        if (opts.panTo !== undefined) {
          const start = opts.when ?? ctx.currentTime;
          panner.pan.setValueAtTime(opts.pan ?? 0, start);
          panner.pan.linearRampToValueAtTime(opts.panTo, start + buf.duration);
        }
        g.connect(panner);
        tail = panner;
      }
      tail.connect(this.sfxBus);

      if (opts.echo) {
        const delay = ctx.createDelay(0.5);
        delay.delayTime.value = 0.12;
        const fb = ctx.createGain();
        fb.gain.value = 0.25;
        const wet = ctx.createGain();
        wet.gain.value = 0.25;
        g.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        delay.connect(wet);
        wet.connect(this.sfxBus);
      }

      src.connect(g);
      src.start(opts.when ?? ctx.currentTime);
    });
  }

  playDialogue(name: string, opts: DialogueOptions = {}) {
    if (!this.ctx) return;
    // One voice at a time — a new cue replaces the old (never queue-stacked).
    this.stopDialogue(0.12);
    void this.loadBuffer(name).then((buf) => {
      if (!buf || !this.ctx || this.ctx.state !== 'running') return;
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = opts.gain ?? 0.9;
      src.connect(g);
      g.connect(this.dialogueBus);

      const active: ActiveDialogue = {
        src,
        gain: g,
        name,
        startedAt: ctx.currentTime,
        duration: buf.duration,
        onEnd: opts.onEnd,
      };
      this.dialogue = active;
      this.duck();
      src.onended = () => {
        if (this.dialogue === active) {
          this.dialogue = null;
          this.releaseDuck();
          opts.onEnd?.();
          this.emit('dialogueend', { name });
        }
      };
      src.start();
    });
  }

  stopDialogue(fadeOut = 0.12) {
    const d = this.dialogue;
    if (!d || !this.ctx) return;
    this.dialogue = null;
    const now = this.ctx.currentTime;
    d.gain.gain.setValueAtTime(d.gain.gain.value, now);
    d.gain.gain.linearRampToValueAtTime(0.0001, now + fadeOut);
    window.setTimeout(() => {
      try {
        d.src.stop();
      } catch {
        /* already stopped */
      }
    }, fadeOut * 1000 + 60);
    this.releaseDuck();
  }

  isDialoguePlaying(): boolean {
    return this.dialogue !== null;
  }

  /** {t, d, name} for the playing dialogue — drives typewriter caption sync. */
  dialogueProgress(): { t: number; d: number; name: string } | null {
    if (!this.dialogue || !this.ctx) return null;
    const t = Math.min(this.ctx.currentTime - this.dialogue.startedAt, this.dialogue.duration);
    return { t, d: this.dialogue.duration, name: this.dialogue.name };
  }

  /* ---------------- ambience loops ---------------- */

  /**
   * Swap the ambience bed with a crossfade (default 1.5s).
   * Loops not present in `specs` fade out and stop; new ones fade in.
   */
  setAmbience(specs: LoopSpec[], fadeSeconds = 1.5) {
    if (!this.ctx) return;
    const wanted = new Map(specs.map((s) => [s.name, s]));

    // Fade out loops that are leaving.
    for (const [name, loop] of this.loops) {
      if (!wanted.has(name)) {
        this.ramp(loop.gain.gain, 0, fadeSeconds);
        const src = loop.src;
        window.setTimeout(() => {
          try {
            src.stop();
          } catch {
            /* already stopped */
          }
        }, fadeSeconds * 1000 + 100);
        this.loops.delete(name);
      }
    }

    // Create or retarget the wanted loops.
    for (const spec of specs) {
      const existing = this.loops.get(spec.name);
      if (existing) {
        this.ramp(existing.gain.gain, spec.gain, fadeSeconds);
        if (spec.filterFreq && existing.filter) {
          this.ramp(existing.filter.frequency, spec.filterFreq, fadeSeconds);
        }
        continue;
      }
      void this.loadBuffer(spec.name).then((buf) => {
        if (!buf || !this.ctx) return;
        // Another setAmbience call may have removed this spec meanwhile.
        if (this.loops.has(spec.name)) return;
        const ctx = this.ctx;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const g = ctx.createGain();
        g.gain.value = 0;
        let filter: BiquadFilterNode | null = null;
        if (spec.filterFreq) {
          filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = spec.filterFreq;
          src.connect(filter);
          filter.connect(g);
        } else {
          src.connect(g);
        }
        g.connect(this.ambienceBus);
        src.start();
        this.loops.set(spec.name, { src, gain: g, filter, name: spec.name });
        this.ramp(g.gain, spec.gain, fadeSeconds);
      });
    }
  }

  rampLoopGain(name: string, gain: number, seconds = 0.6) {
    const loop = this.loops.get(name);
    if (loop) this.ramp(loop.gain.gain, gain, seconds);
  }

  /** Open the moor wind's low-pass as the hound's eyes ignite. */
  rampLoopFilter(name: string, freq: number, seconds = 1.5) {
    const loop = this.loops.get(name);
    if (loop?.filter) this.ramp(loop.filter.frequency, freq, seconds);
  }

  /* ---------------- master mute ---------------- */

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* private mode */
    }
    if (this.ctx) this.ramp(this.master.gain, muted ? 0 : 1, 0.4);
    this.emit('mute', { muted });
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }
}

export const AudioService = new AudioServiceImpl();
export type AudioServiceType = AudioServiceImpl;
