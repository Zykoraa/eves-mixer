// GrossBeatEngine.ts - FL Studio style Gross Beat & Time-Glitch FX Unit
// Features: Ring-buffer time manipulation, Half-Speed (1/2x), Double-Speed (2x),
// Momentary Reverse, Vinyl Slowdown / Spin-down curves, 1/8 & 1/16 Stutter, Turntable Scratching, and Volume Gating.

export type GrossBeatTimePreset =
  | 'bypass'
  | 'halfSpeed'
  | 'doubleSpeed'
  | 'reverse1Bar'
  | 'reverse2Beats'
  | 'vinylStop'
  | 'stutter8th'
  | 'stutter16th'
  | 'tripletGlitch'
  | 'scratchSpin'
  | 'custom';

export type GrossBeatVolPreset =
  | 'bypass'
  | 'sidechainPump'
  | 'tranceGate8th'
  | 'stutterGate16th'
  | 'tripletGate';

export interface SplinePoint {
  x: number; // 0 to 1 (phase in bar)
  y: number; // 0 to 1 (playback position / volume)
}

export class GrossBeatEngine {
  private static instance: GrossBeatEngine;
  private ctx: AudioContext | null = null;

  public inputNode: GainNode | null = null;
  public outputNode: GainNode | null = null;
  public dryGain: GainNode | null = null;
  public wetGain: GainNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;

  // Ring buffer: 8 seconds of stereo 32-bit float audio
  private bufferSize = 4096;
  private ringBufferL: Float32Array = new Float32Array(0);
  private ringBufferR: Float32Array = new Float32Array(0);
  private ringCapacity = 0;
  private writePos = 0;

  // Transport sync state
  private bpm = 120;
  private isPlaying = false;
  private currentSampleInBar = 0;

  // Preset & Modulation parameters
  public enabled = false;
  public mix = 1.0; // 0 to 1
  public timePreset: GrossBeatTimePreset = 'halfSpeed';
  public volPreset: GrossBeatVolPreset = 'bypass';
  public customTimePoints: SplinePoint[] = [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.25 },
    { x: 1, y: 0.5 },
  ];

  // Listener for UI playhead animation
  private onPhaseListeners: Set<(phase: number) => void> = new Set();

  private constructor() {}

  public static getInstance(): GrossBeatEngine {
    if (!GrossBeatEngine.instance) {
      GrossBeatEngine.instance = new GrossBeatEngine();
    }
    return GrossBeatEngine.instance;
  }

  public init(ctx: AudioContext) {
    if (this.ctx === ctx) return;
    this.ctx = ctx;

    // Allocate 8 seconds of circular buffer
    this.ringCapacity = Math.ceil(ctx.sampleRate * 8);
    this.ringBufferL = new Float32Array(this.ringCapacity);
    this.ringBufferR = new Float32Array(this.ringCapacity);
    this.writePos = 0;

    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.setMix(this.mix);

    // Create 4096-sample script processor for stereo ring buffer modulation
    this.processorNode = ctx.createScriptProcessor(this.bufferSize, 2, 2);
    this.processorNode.onaudioprocess = (e) => this.processAudio(e);

    // Wire: input -> dryGain -> output
    //       input -> processorNode -> wetGain -> output
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.outputNode);

    this.inputNode.connect(this.processorNode);
    this.processorNode.connect(this.wetGain);
    this.wetGain.connect(this.outputNode);
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!this.ctx || !this.dryGain || !this.wetGain) return;

    if (!enabled) {
      this.dryGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.02);
      this.wetGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.02);
    } else {
      this.setMix(this.mix);
    }
  }

  public setMix(mix: number) {
    this.mix = Math.max(0, Math.min(1, mix));
    if (!this.ctx || !this.dryGain || !this.wetGain) return;

    if (!this.enabled) {
      this.dryGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.02);
      this.wetGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.02);
    } else {
      this.dryGain.gain.setTargetAtTime(1.0 - this.mix, this.ctx.currentTime, 0.02);
      this.wetGain.gain.setTargetAtTime(this.mix, this.ctx.currentTime, 0.02);
    }
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(260, bpm));
  }

  public setTransport(isPlaying: boolean, currentBarSample = 0) {
    this.isPlaying = isPlaying;
    if (!isPlaying) {
      this.currentSampleInBar = 0;
    } else if (currentBarSample >= 0) {
      this.currentSampleInBar = currentBarSample;
    }
  }

  public addPhaseListener(cb: (phase: number) => void) {
    this.onPhaseListeners.add(cb);
    return () => {
      this.onPhaseListeners.delete(cb);
    };
  }

  // Evaluate time mapping: phase (0 to 1 in bar) -> target bar position (0 to 1)
  public evaluateTimeCurve(phase: number): number {
    switch (this.timePreset) {
      case 'bypass':
        return phase;

      case 'halfSpeed':
        // Half-Time: 0.5x rate in 2-beat repeating chunks
        return (phase % 0.5) * 0.5;

      case 'doubleSpeed':
        // 2x speed-up
        return (phase * 2.0) % 1.0;

      case 'reverse1Bar':
        // 1-Bar backward playback
        return Math.max(0, Math.min(1, 1.0 - phase));

      case 'reverse2Beats':
        // 2-Beat backward repeats
        return 0.5 - (phase % 0.5);

      case 'vinylStop': {
        // Slows down to 0 smoothly over 1 bar
        const remaining = 1.0 - phase;
        return Math.max(0, 1.0 - Math.pow(remaining, 2));
      }

      case 'stutter8th': {
        // Repeats first 1/8th note chunk in every quarter note
        const eighth = 0.125;
        return Math.floor(phase / (eighth * 2)) * (eighth * 2) + (phase % eighth);
      }

      case 'stutter16th': {
        // Repeats 1/16th note chunk
        const sixteenth = 0.0625;
        return (phase % sixteenth) * 0.8;
      }

      case 'tripletGlitch': {
        // Triplet rhythmic jump
        const triplet = 1 / 3;
        return (phase % triplet) * 0.75;
      }

      case 'scratchSpin': {
        // Sinusoidal DJ vinyl back-and-forth scrub
        return 0.5 + 0.35 * Math.sin(phase * Math.PI * 4);
      }

      case 'custom':
        return this.interpolateSpline(this.customTimePoints, phase);

      default:
        return phase;
    }
  }

  // Evaluate volume envelope gating: phase (0 to 1) -> volume multiplier (0 to 1)
  public evaluateVolCurve(phase: number): number {
    switch (this.volPreset) {
      case 'bypass':
        return 1.0;

      case 'sidechainPump': {
        // 4-on-the-floor quarter note ducking pump
        const beatPhase = (phase * 4) % 1.0;
        return Math.pow(beatPhase, 0.4);
      }

      case 'tranceGate8th': {
        // 1/8 note rhythmic on/off chop
        const eighthPhase = (phase * 8) % 1.0;
        return eighthPhase < 0.5 ? 1.0 : 0.0;
      }

      case 'stutterGate16th': {
        // 1/16 note rapid gate
        const sixteenthPhase = (phase * 16) % 1.0;
        return sixteenthPhase < 0.45 ? 1.0 : 0.0;
      }

      case 'tripletGate': {
        // Triplet chop
        const tripPhase = (phase * 6) % 1.0;
        return tripPhase < 0.5 ? 1.0 : 0.0;
      }

      default:
        return 1.0;
    }
  }

  private interpolateSpline(points: SplinePoint[], x: number): number {
    if (!points || points.length === 0) return x;
    if (points.length === 1) return points[0].y;

    const sorted = [...points].sort((a, b) => a.x - b.x);
    if (x <= sorted[0].x) return sorted[0].y;
    if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;

    for (let i = 0; i < sorted.length - 1; i++) {
      const p1 = sorted[i];
      const p2 = sorted[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const dx = p2.x - p1.x;
        if (dx <= 0.0001) return p1.y;
        const t = (x - p1.x) / dx;
        // Smooth Hermite interpolation
        const smoothT = t * t * (3 - 2 * t);
        return p1.y + (p2.y - p1.y) * smoothT;
      }
    }
    return x;
  }

  private processAudio(e: AudioProcessingEvent) {
    const inputL = e.inputBuffer.getChannelData(0);
    const inputR = e.inputBuffer.getChannelData(1);
    const outputL = e.outputBuffer.getChannelData(0);
    const outputR = e.outputBuffer.getChannelData(1);
    const numSamples = inputL.length;

    if (!this.enabled || !this.ctx) {
      // Passthrough
      for (let i = 0; i < numSamples; i++) {
        outputL[i] = inputL[i];
        outputR[i] = inputR[i];
      }
      return;
    }

    const sampleRate = this.ctx.sampleRate;
    // 1 bar = 4 quarter notes = 4 * (60 / bpm) seconds
    const barDurationSamples = (sampleRate * 240) / this.bpm;

    let barPhase = 0;

    for (let i = 0; i < numSamples; i++) {
      // 1. Write incoming dry audio to circular buffer
      this.ringBufferL[this.writePos] = inputL[i];
      this.ringBufferR[this.writePos] = inputR[i];

      // 2. Compute current bar phase (0.0 to 1.0)
      barPhase = (this.currentSampleInBar / barDurationSamples) % 1.0;

      // 3. Time modulation curve target
      const targetTimeFrac = this.evaluateTimeCurve(barPhase);
      const volMultiplier = this.evaluateVolCurve(barPhase);

      // Distance in samples behind write position:
      // If targetTimeFrac is 0, delay is 1 full bar. If targetTimeFrac is 1, delay is 0.
      const delaySamples = (1.0 - targetTimeFrac) * barDurationSamples;
      let readPos = this.writePos - delaySamples;
      while (readPos < 0) readPos += this.ringCapacity;
      while (readPos >= this.ringCapacity) readPos -= this.ringCapacity;

      // Linear interpolation between sample bins
      const readIdx0 = Math.floor(readPos);
      const readIdx1 = (readIdx0 + 1) % this.ringCapacity;
      const frac = readPos - readIdx0;

      const sampleL = this.ringBufferL[readIdx0] * (1 - frac) + this.ringBufferL[readIdx1] * frac;
      const sampleR = this.ringBufferR[readIdx0] * (1 - frac) + this.ringBufferR[readIdx1] * frac;

      outputL[i] = sampleL * volMultiplier;
      outputR[i] = sampleR * volMultiplier;

      // Increment circular pointers
      this.writePos = (this.writePos + 1) % this.ringCapacity;
      this.currentSampleInBar = (this.currentSampleInBar + 1) % barDurationSamples;
    }

    // Broadcast current phase to UI listeners
    if (this.onPhaseListeners.size > 0) {
      this.onPhaseListeners.forEach((cb) => cb(barPhase));
    }
  }
}
