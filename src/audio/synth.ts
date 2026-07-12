/**
 * Tiny WebAudio synthesizer — placeholder-first applied to AUDIO (§10):
 * zero sound files ship; every effect is an oscillator/noise envelope. When
 * real audio arrives, AudioDirector swaps these calls for Phaser sound keys
 * and this file retires.
 *
 * Autoplay policy: the context is created lazily and resume() is retried on
 * every play — by the time PlayScene runs, the user has already pressed a
 * key on the menu (a valid gesture).
 */

export interface BlipOptions {
  freq: number;
  /** Pitch glide target; defaults to freq (no glide). */
  endFreq?: number;
  durationMs: number;
  type?: OscillatorType;
  volume?: number;
}

export interface NoiseOptions {
  durationMs: number;
  volume?: number;
  /** Lowpass cutoff — low = thud, high = whoosh/hiss. */
  filterFreq?: number;
}

export interface Drone {
  /** 0..1 — zone darkness scales this. */
  setIntensity(v: number): void;
  stop(): void;
}

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private failed = false;

  /** Lazily create/resume. Returns null when audio is unavailable — every
   *  caller degrades to silence rather than crashing the game. */
  private ensure(): AudioContext | null {
    if (this.failed) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      } catch {
        this.failed = true;
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  blip(opts: BlipOptions): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const dur = opts.durationMs / 1000;

    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq ?? opts.freq), t + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.volume ?? 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  noise(opts: NoiseOptions): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const dur = opts.durationMs / 1000;

    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = opts.filterFreq ?? 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.volume ?? 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
  }

  /** Looping ambient bed: two slightly detuned low oscillators through a
   *  lowpass. Intensity maps to gain — darker zones press harder. */
  startDrone(): Drone {
    const ctx = this.ensure();
    if (!ctx || !this.master) return { setIntensity: () => {}, stop: () => {} };

    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    filter.connect(gain).connect(this.master);

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 55;
    const oscB = ctx.createOscillator();
    oscB.type = 'triangle';
    oscB.frequency.value = 55 * 1.02; // slow beating between the pair
    oscA.connect(filter);
    oscB.connect(filter);
    oscA.start();
    oscB.start();

    return {
      setIntensity: (v) => {
        gain.gain.linearRampToValueAtTime(0.055 * v, ctx.currentTime + 1.2);
      },
      stop: () => {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        oscA.stop(ctx.currentTime + 0.5);
        oscB.stop(ctx.currentTime + 0.5);
      },
    };
  }

  destroy(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}
