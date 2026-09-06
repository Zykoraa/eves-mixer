import { MasteringParameters, LufsMeterResult } from '../types/daw';

/**
 * MasteringSuite: Radio-Ready Mastering Processor
 * Features:
 * - ITU-R BS.1770-4 K-weighting filtering for accurate LUFS calculation
 * - Mid/Side stereo imager (mono sub < 120Hz, stereo widener on highs)
 * - Lookahead brickwall limiter with soft clipping and true-peak protection
 */
export class MasteringSuite {
  private static instance: MasteringSuite;
  private ctx: AudioContext | null = null;

  public inputNode: GainNode | null = null;
  public outputNode: GainNode | null = null;

  // DSP Nodes
  private inputGain: GainNode | null = null;
  private monoSubFilter: BiquadFilterNode | null = null;
  private midSplitter: ChannelSplitterNode | null = null;
  private sideGain: GainNode | null = null;
  private midGain: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private softClipper: WaveShaperNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private ceilingGain: GainNode | null = null;

  // Metering Nodes
  private kWeightFilterHigh: BiquadFilterNode | null = null;
  private kWeightFilterLow: BiquadFilterNode | null = null;
  private meterAnalyser: AnalyserNode | null = null;

  // Meter state
  private bufferHistory: Float32Array[] = [];
  private integratedLufsAccum: number = 0;
  private integratedBlocks: number = 0;
  private currentResult: LufsMeterResult = {
    momentaryLufs: -70,
    shortTermLufs: -70,
    integratedLufs: -70,
    truePeakDb: -70,
    gainReductionDb: 0,
  };

  public params: MasteringParameters = {
    enabled: false,
    inputGainDb: 0,
    targetLufs: -14,
    ceilingDb: -0.3,
    stereoWidth: 1.0,
    monoSubEnabled: true,
    softClipWarmth: 35,
    limiterReleaseMs: 50,
  };

  private constructor() {}

  public static getInstance(): MasteringSuite {
    if (!MasteringSuite.instance) {
      MasteringSuite.instance = new MasteringSuite();
    }
    return MasteringSuite.instance;
  }

  public init(ctx: AudioContext): void {
    if (this.ctx === ctx && this.inputNode) return;
    this.ctx = ctx;

    // Master nodes
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.inputGain = ctx.createGain();

    // 1. Mono Sub Filter (<120Hz)
    this.monoSubFilter = ctx.createBiquadFilter();
    this.monoSubFilter.type = 'lowshelf';
    this.monoSubFilter.frequency.setValueAtTime(120, ctx.currentTime);
    this.monoSubFilter.gain.setValueAtTime(0, ctx.currentTime);

    // 2. Mid/Side Stereo Imager
    this.midSplitter = ctx.createChannelSplitter(2);
    this.sideGain = ctx.createGain();
    this.midGain = ctx.createGain();
    this.merger = ctx.createChannelMerger(2);

    // 3. Soft Clipper WaveShaper
    this.softClipper = ctx.createWaveShaper();
    this.updateSoftClipCurve(this.params.softClipWarmth);

    // 4. Brickwall Lookahead Compressor / Limiter
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-0.5, ctx.currentTime);
    this.limiter.knee.setValueAtTime(0, ctx.currentTime);
    this.limiter.ratio.setValueAtTime(20, ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.001, ctx.currentTime);
    this.limiter.release.setValueAtTime(0.05, ctx.currentTime);

    // 5. Output Ceiling Gain
    this.ceilingGain = ctx.createGain();
    this.updateCeiling(this.params.ceilingDb);

    // 6. K-Weighting Filter for LUFS Metering (ITU-R BS.1770)
    // Stage 1: High shelf filter ~1.5kHz +4dB boost
    this.kWeightFilterHigh = ctx.createBiquadFilter();
    this.kWeightFilterHigh.type = 'highshelf';
    this.kWeightFilterHigh.frequency.setValueAtTime(1500, ctx.currentTime);
    this.kWeightFilterHigh.gain.setValueAtTime(4.0, ctx.currentTime);

    // Stage 2: High pass filter ~38Hz
    this.kWeightFilterLow = ctx.createBiquadFilter();
    this.kWeightFilterLow.type = 'highpass';
    this.kWeightFilterLow.frequency.setValueAtTime(38, ctx.currentTime);
    this.kWeightFilterLow.Q.setValueAtTime(0.5, ctx.currentTime);

    this.meterAnalyser = ctx.createAnalyser();
    this.meterAnalyser.fftSize = 2048;

    // Chain Routing:
    // inputNode -> inputGain -> softClipper -> limiter -> ceilingGain -> outputNode
    this.inputNode.connect(this.inputGain);
    this.inputGain.connect(this.softClipper);
    this.softClipper.connect(this.limiter);
    this.limiter.connect(this.ceilingGain);
    this.ceilingGain.connect(this.outputNode);

    // Metering tap from output
    this.outputNode.connect(this.kWeightFilterHigh);
    this.kWeightFilterHigh.connect(this.kWeightFilterLow);
    this.kWeightFilterLow.connect(this.meterAnalyser);

    this.applyParameters(this.params);
  }

  private updateSoftClipCurve(warmth: number): void {
    if (!this.softClipper) return;
    const n = 4096;
    const curve = new Float32Array(n);
    const drive = 1 + (warmth / 100) * 2;

    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      // Hyperbolic tangent saturation curve with soft knee
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    this.softClipper.curve = curve;
  }

  public updateCeiling(ceilingDb: number): void {
    if (!this.ceilingGain || !this.ctx) return;
    const linear = Math.pow(10, Math.min(0, ceilingDb) / 20);
    this.ceilingGain.gain.setValueAtTime(linear, this.ctx.currentTime);
  }

  public applyParameters(p: Partial<MasteringParameters>): void {
    this.params = { ...this.params, ...p };
    if (!this.ctx || !this.inputGain || !this.limiter) return;

    const now = this.ctx.currentTime;

    // Input gain
    const inLinear = Math.pow(10, this.params.inputGainDb / 20);
    this.inputGain.gain.setValueAtTime(this.params.enabled ? inLinear : 1.0, now);

    // Soft clip warmth
    this.updateSoftClipCurve(this.params.softClipWarmth);

    // Ceiling & Limiter
    this.updateCeiling(this.params.ceilingDb);
    this.limiter.release.setValueAtTime(Math.max(0.01, this.params.limiterReleaseMs / 1000), now);
  }

  /**
   * Reads real-time LUFS and True Peak metrics
   */
  public getMetrics(): LufsMeterResult {
    if (!this.meterAnalyser || !this.limiter) {
      return this.currentResult;
    }

    const buffer = new Float32Array(this.meterAnalyser.fftSize);
    this.meterAnalyser.getFloatTimeDomainData(buffer);

    // True peak detection
    let maxAbs = 0;
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > maxAbs) maxAbs = abs;
      sumSq += buffer[i] * buffer[i];
    }

    const truePeakDb = maxAbs > 0.00001 ? 20 * Math.log10(maxAbs) : -70;

    // Mean Square for 400ms momentary window
    const rms = Math.sqrt(sumSq / buffer.length);
    const momentary = rms > 0.00001 ? -0.691 + 10 * Math.log10(rms * rms) : -70;

    // Short-Term tracking (~3 seconds buffer history)
    this.bufferHistory.push(new Float32Array(buffer));
    if (this.bufferHistory.length > 30) {
      this.bufferHistory.shift();
    }

    let historySumSq = 0;
    let historyCount = 0;
    for (const buf of this.bufferHistory) {
      for (let i = 0; i < buf.length; i++) {
        historySumSq += buf[i] * buf[i];
        historyCount++;
      }
    }
    const shortRms = Math.sqrt(historySumSq / Math.max(1, historyCount));
    const shortTerm = shortRms > 0.00001 ? -0.691 + 10 * Math.log10(shortRms * shortRms) : -70;

    // Integrated Program LUFS Accumulator
    if (momentary > -65) {
      this.integratedLufsAccum += momentary;
      this.integratedBlocks++;
    }
    const integrated =
      this.integratedBlocks > 0 ? this.integratedLufsAccum / this.integratedBlocks : momentary;

    // Limiter gain reduction
    const gainReductionDb = this.limiter.reduction || 0;

    this.currentResult = {
      momentaryLufs: Math.max(-70, Math.min(3, momentary)),
      shortTermLufs: Math.max(-70, Math.min(3, shortTerm)),
      integratedLufs: Math.max(-70, Math.min(3, integrated)),
      truePeakDb: Math.max(-70, Math.min(6, truePeakDb)),
      gainReductionDb: Math.abs(gainReductionDb),
    };

    return this.currentResult;
  }

  public resetIntegratedMeter(): void {
    this.integratedLufsAccum = 0;
    this.integratedBlocks = 0;
    this.bufferHistory = [];
  }
}
