import { TapeColorParameters } from '../types/daw';

/**
 * TapeColorEngine: Vintage Vinyl & Magnetic Tape Processor (RC-20 style)
 * Modules:
 * 1. Wow & Flutter: LFO-modulated delay line for analog tape pitch wobble
 * 2. Tube / Tape Drive: Asymmetrical saturation waveshaper
 * 3. Vinyl Crackle & Hiss: Procedural vinyl dust clicks and filtered surface noise
 * 4. Dropouts: Randomized micro-ducking simulating worn tape reels
 * 5. Reverb Space: Vintage plate/spring ambience
 */
export class TapeColorEngine {
  private static instance: TapeColorEngine;
  private ctx: AudioContext | null = null;

  public inputNode: GainNode | null = null;
  public outputNode: GainNode | null = null;

  // Wet / Dry
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  // Wow & Flutter
  private delayNode: DelayNode | null = null;
  private wowOsc: OscillatorNode | null = null;
  private wowGain: GainNode | null = null;
  private flutterOsc: OscillatorNode | null = null;
  private flutterGain: GainNode | null = null;

  // Saturation
  private driveGain: GainNode | null = null;
  private saturator: WaveShaperNode | null = null;

  // Vinyl Noise & Crackle
  private vinylNoiseSource: AudioBufferSourceNode | null = null;
  private vinylFilter: BiquadFilterNode | null = null;
  private vinylGain: GainNode | null = null;

  // Dropouts
  private dropoutGain: GainNode | null = null;
  private dropoutInterval: number | null = null;

  // Space
  private convolver: ConvolverNode | null = null;
  private spaceGain: GainNode | null = null;

  public params: TapeColorParameters = {
    enabled: false,
    wowFlutter: 40,
    flutterRate: 1.2,
    tapeDrive: 35,
    vinylNoise: 25,
    vinylTone: 50,
    dropouts: 20,
    spaceReverb: 15,
    mix: 75,
  };

  private constructor() {}

  public static getInstance(): TapeColorEngine {
    if (!TapeColorEngine.instance) {
      TapeColorEngine.instance = new TapeColorEngine();
    }
    return TapeColorEngine.instance;
  }

  public init(ctx: AudioContext): void {
    if (this.ctx === ctx && this.inputNode) return;
    this.ctx = ctx;

    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    // 1. Wow & Flutter delay line
    this.delayNode = ctx.createDelay(0.1);
    this.delayNode.delayTime.setValueAtTime(0.015, ctx.currentTime);

    this.wowOsc = ctx.createOscillator();
    this.wowOsc.frequency.setValueAtTime(0.6, ctx.currentTime); // slow wow
    this.wowGain = ctx.createGain();
    this.wowGain.gain.setValueAtTime(0.0015, ctx.currentTime);
    this.wowOsc.connect(this.wowGain);
    this.wowGain.connect(this.delayNode.delayTime);
    this.wowOsc.start();

    this.flutterOsc = ctx.createOscillator();
    this.flutterOsc.frequency.setValueAtTime(this.params.flutterRate, ctx.currentTime); // fast flutter
    this.flutterGain = ctx.createGain();
    this.flutterGain.gain.setValueAtTime(0.0006, ctx.currentTime);
    this.flutterOsc.connect(this.flutterGain);
    this.flutterGain.connect(this.delayNode.delayTime);
    this.flutterOsc.start();

    // 2. Drive & Saturation
    this.driveGain = ctx.createGain();
    this.saturator = ctx.createWaveShaper();
    this.updateSaturationCurve(this.params.tapeDrive);

    // 3. Dropouts
    this.dropoutGain = ctx.createGain();
    this.dropoutGain.gain.setValueAtTime(1.0, ctx.currentTime);

    // 4. Space / Reverb
    this.convolver = ctx.createConvolver();
    this.convolver.buffer = this.generateSpringImpulse(ctx);
    this.spaceGain = ctx.createGain();
    this.spaceGain.gain.setValueAtTime(this.params.spaceReverb / 100, ctx.currentTime);

    // 5. Vinyl Noise Generator
    this.vinylFilter = ctx.createBiquadFilter();
    this.vinylFilter.type = 'bandpass';
    this.vinylFilter.frequency.setValueAtTime(1200, ctx.currentTime);
    this.vinylFilter.Q.setValueAtTime(1.2, ctx.currentTime);

    this.vinylGain = ctx.createGain();
    this.vinylGain.gain.setValueAtTime(0, ctx.currentTime);

    this.startVinylNoise();

    // Wet signal routing:
    // inputNode -> delayNode (wow/flutter) -> driveGain -> saturator -> dropoutGain
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.driveGain);
    this.driveGain.connect(this.saturator);
    this.saturator.connect(this.dropoutGain);

    // Convolver tap
    this.dropoutGain.connect(this.convolver);
    this.convolver.connect(this.spaceGain);
    this.spaceGain.connect(this.wetGain);

    this.dropoutGain.connect(this.wetGain);
    this.vinylFilter.connect(this.vinylGain);
    this.vinylGain.connect(this.wetGain);

    this.wetGain.connect(this.outputNode);

    this.setupDropouts();
    this.applyParameters(this.params);
  }

  private updateSaturationCurve(drive: number): void {
    if (!this.saturator) return;
    const n = 2048;
    const curve = new Float32Array(n);
    const k = 1 + (drive / 100) * 3.5;

    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      // Asymmetric saturation adding warm 2nd & 3rd harmonics
      const y = Math.tanh(k * x) + 0.1 * Math.sin(Math.PI * x * k);
      curve[i] = y / Math.max(1, Math.tanh(k));
    }
    this.saturator.curve = curve;
  }

  private generateSpringImpulse(ctx: AudioContext): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = rate * 1.2; // 1.2s spring decay
    const buffer = ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = Math.exp(-t * 5.0);
      const chirp = Math.sin(2 * Math.PI * (120 + t * 450) * (i / rate));
      const noise = (Math.random() * 2 - 1) * 0.4;
      left[i] = (chirp * 0.4 + noise) * decay;
      right[i] = (chirp * -0.4 + noise) * decay;
    }
    return buffer;
  }

  private startVinylNoise(): void {
    if (!this.ctx || !this.vinylFilter) return;
    const rate = this.ctx.sampleRate;
    const length = rate * 4; // 4s seamless vinyl loop
    const buffer = this.ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      // Background pink/brown hiss
      let sample = (Math.random() * 2 - 1) * 0.08;
      // Random dust clicks & pops
      if (Math.random() < 0.0015) {
        sample += (Math.random() * 2 - 1) * 0.85;
      }
      data[i] = sample;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.vinylFilter);
    source.start();
    this.vinylNoiseSource = source;
  }

  private setupDropouts(): void {
    if (this.dropoutInterval) {
      clearInterval(this.dropoutInterval);
    }

    this.dropoutInterval = window.setInterval(() => {
      if (!this.params.enabled || !this.ctx || !this.dropoutGain || this.params.dropouts <= 0) return;
      const prob = (this.params.dropouts / 100) * 0.35;
      if (Math.random() < prob) {
        const now = this.ctx.currentTime;
        const dipDepth = 0.35 + Math.random() * 0.45;
        const dur = 0.04 + Math.random() * 0.08;
        this.dropoutGain.gain.cancelScheduledValues(now);
        this.dropoutGain.gain.setValueAtTime(1.0, now);
        this.dropoutGain.gain.linearRampToValueAtTime(dipDepth, now + dur * 0.3);
        this.dropoutGain.gain.linearRampToValueAtTime(1.0, now + dur);
      }
    }, 400);
  }

  public applyParameters(p: Partial<TapeColorParameters>): void {
    this.params = { ...this.params, ...p };
    if (!this.ctx || !this.dryGain || !this.wetGain) return;

    const now = this.ctx.currentTime;
    const isEnabled = this.params.enabled;

    // Mix dry/wet
    const wet = isEnabled ? this.params.mix / 100 : 0;
    const dry = isEnabled ? 1 - wet : 1.0;
    this.wetGain.gain.setValueAtTime(wet, now);
    this.dryGain.gain.setValueAtTime(dry, now);

    // Wow & flutter
    if (this.wowGain && this.flutterGain) {
      const wowAmt = (this.params.wowFlutter / 100) * 0.003;
      this.wowGain.gain.setValueAtTime(wowAmt, now);
      this.flutterGain.gain.setValueAtTime(wowAmt * 0.4, now);
      if (this.flutterOsc) {
        this.flutterOsc.frequency.setValueAtTime(this.params.flutterRate, now);
      }
    }

    // Drive
    this.updateSaturationCurve(this.params.tapeDrive);

    // Vinyl Noise
    if (this.vinylGain && this.vinylFilter) {
      const noiseGain = (this.params.vinylNoise / 100) * 0.18;
      this.vinylGain.gain.setValueAtTime(isEnabled ? noiseGain : 0, now);
      const toneFreq = 400 + (this.params.vinylTone / 100) * 4500;
      this.vinylFilter.frequency.setValueAtTime(toneFreq, now);
    }

    // Space
    if (this.spaceGain) {
      this.spaceGain.gain.setValueAtTime((this.params.spaceReverb / 100) * 0.6, now);
    }
  }

  public destroy(): void {
    if (this.dropoutInterval) {
      clearInterval(this.dropoutInterval);
    }
  }
}
