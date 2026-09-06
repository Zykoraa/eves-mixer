import { FxSettings } from '../types/daw';

export class EffectsChain {
  private ctx: AudioContext;
  public inputNode: GainNode;
  public outputNode: GainNode;

  // Effects nodes
  private eqFilters: BiquadFilterNode[] = [];

  // Distortion
  private distInput: GainNode;
  private distShaper: WaveShaperNode;
  public distDryGain: GainNode;
  public distWetGain: GainNode;
  private distOutput: GainNode;

  // Compressor
  private compressor: DynamicsCompressorNode;
  private compressorMakeup: GainNode;

  // Chorus
  private chorusInput: GainNode;
  private chorusDelayL: DelayNode;
  private chorusDelayR: DelayNode;
  private chorusLfo: OscillatorNode;
  private chorusLfoGain: GainNode;
  public chorusDry: GainNode;
  public chorusWet: GainNode;
  private chorusOutput: GainNode;

  // Delay
  private delayInput: GainNode;
  private delayNodeL: DelayNode;
  private delayNodeR: DelayNode;
  private delayFeedbackL: GainNode;
  private delayFeedbackR: GainNode;
  private delayFilter: BiquadFilterNode;
  public delayDry: GainNode;
  public delayWet: GainNode;
  private delayOutput: GainNode;

  // Reverb
  private reverbInput: GainNode;
  public reverbConvolver: ConvolverNode;
  public reverbDry: GainNode;
  public reverbWet: GainNode;
  private reverbOutput: GainNode;

  // Filter
  public resFilter: BiquadFilterNode;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();

    // 1. EQ
    const freqs = [30, 100, 500, 2500, 8000];
    const types: BiquadFilterType[] = ['highpass', 'lowshelf', 'peaking', 'peaking', 'highshelf'];
    for (let i = 0; i < 5; i++) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = types[i];
      filter.frequency.setValueAtTime(freqs[i], this.ctx.currentTime);
      filter.Q.setValueAtTime(0.7, this.ctx.currentTime);
      filter.gain.setValueAtTime(0, this.ctx.currentTime);
      this.eqFilters.push(filter);
    }
    // Chain EQ filters
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }

    // 2. Distortion
    this.distInput = this.ctx.createGain();
    this.distShaper = this.ctx.createWaveShaper();
    this.distShaper.oversample = '4x';
    this.distDryGain = this.ctx.createGain();
    this.distWetGain = this.ctx.createGain();
    this.distOutput = this.ctx.createGain();

    this.distInput.connect(this.distDryGain);
    this.distInput.connect(this.distShaper);
    this.distShaper.connect(this.distWetGain);
    this.distDryGain.connect(this.distOutput);
    this.distWetGain.connect(this.distOutput);

    // 3. Resonant Filter
    this.resFilter = this.ctx.createBiquadFilter();
    this.resFilter.type = 'lowpass';
    this.resFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);
    this.resFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    // 4. Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressorMakeup = this.ctx.createGain();
    this.compressor.connect(this.compressorMakeup);

    // 5. Chorus
    this.chorusInput = this.ctx.createGain();
    this.chorusDelayL = this.ctx.createDelay();
    this.chorusDelayR = this.ctx.createDelay();
    this.chorusDelayL.delayTime.setValueAtTime(0.025, this.ctx.currentTime);
    this.chorusDelayR.delayTime.setValueAtTime(0.03, this.ctx.currentTime);

    this.chorusLfo = this.ctx.createOscillator();
    this.chorusLfo.frequency.setValueAtTime(1.5, this.ctx.currentTime);
    this.chorusLfoGain = this.ctx.createGain();
    this.chorusLfoGain.gain.setValueAtTime(0.002, this.ctx.currentTime);
    this.chorusLfo.connect(this.chorusLfoGain);
    this.chorusLfoGain.connect(this.chorusDelayL.delayTime);
    this.chorusLfoGain.connect(this.chorusDelayR.delayTime);
    this.chorusLfo.start();

    this.chorusDry = this.ctx.createGain();
    this.chorusWet = this.ctx.createGain();
    this.chorusOutput = this.ctx.createGain();

    this.chorusInput.connect(this.chorusDry);
    this.chorusInput.connect(this.chorusDelayL);
    this.chorusInput.connect(this.chorusDelayR);
    this.chorusDelayL.connect(this.chorusWet);
    this.chorusDelayR.connect(this.chorusWet);
    this.chorusDry.connect(this.chorusOutput);
    this.chorusWet.connect(this.chorusOutput);

    // 6. Delay
    this.delayInput = this.ctx.createGain();
    this.delayNodeL = this.ctx.createDelay();
    this.delayNodeR = this.ctx.createDelay();
    this.delayNodeL.delayTime.setValueAtTime(0.25, this.ctx.currentTime);
    this.delayNodeR.delayTime.setValueAtTime(0.375, this.ctx.currentTime);

    this.delayFeedbackL = this.ctx.createGain();
    this.delayFeedbackR = this.ctx.createGain();
    this.delayFeedbackL.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.delayFeedbackR.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.delayFilter = this.ctx.createBiquadFilter();
    this.delayFilter.type = 'lowpass';
    this.delayFilter.frequency.setValueAtTime(4000, this.ctx.currentTime);

    this.delayDry = this.ctx.createGain();
    this.delayWet = this.ctx.createGain();
    this.delayOutput = this.ctx.createGain();

    this.delayInput.connect(this.delayDry);
    this.delayInput.connect(this.delayNodeL);
    this.delayNodeL.connect(this.delayFeedbackL);
    this.delayFeedbackL.connect(this.delayFilter);
    this.delayFilter.connect(this.delayNodeR);
    this.delayNodeR.connect(this.delayFeedbackR);
    this.delayFeedbackR.connect(this.delayNodeL);

    this.delayNodeL.connect(this.delayWet);
    this.delayNodeR.connect(this.delayWet);
    this.delayDry.connect(this.delayOutput);
    this.delayWet.connect(this.delayOutput);

    // 7. Reverb
    this.reverbInput = this.ctx.createGain();
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.buildImpulseResponse(2.5, 0.4);

    this.reverbDry = this.ctx.createGain();
    this.reverbWet = this.ctx.createGain();
    this.reverbOutput = this.ctx.createGain();

    this.reverbInput.connect(this.reverbDry);
    this.reverbInput.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbWet);
    this.reverbDry.connect(this.reverbOutput);
    this.reverbWet.connect(this.reverbOutput);

    // Default connection topology:
    // inputNode -> EQ -> Distortion -> Filter -> Chorus -> Delay -> Reverb -> Compressor -> outputNode
    this.inputNode.connect(this.eqFilters[0]);
    this.eqFilters[this.eqFilters.length - 1].connect(this.distInput);
    this.distOutput.connect(this.resFilter);
    this.resFilter.connect(this.chorusInput);
    this.chorusOutput.connect(this.delayInput);
    this.delayOutput.connect(this.reverbInput);
    this.reverbOutput.connect(this.compressor);
    this.compressorMakeup.connect(this.outputNode);

    // Initialize bypass / levels
    this.setDistortion(false, 0.2, 'tube', 0);
    this.setChorus(false, 1.5, 0.3, 0);
    this.setDelay(false, 0.25, 0.3, 0);
    this.setReverb(false, 2.0, 0, 0.3);
    this.setCompressor(false, -16, 3, 0.01, 0.15, 0);
  }

  private buildImpulseResponse(duration: number, decay: number): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const length = rate * Math.max(0.2, duration);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const factor = Math.pow(n / length, decay * 3);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  private makeDistortionCurve(amount: number, type: 'soft' | 'hard' | 'tube' | 'fuzz'): Float32Array {
    const k = amount * 50;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;

    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      if (type === 'tube') {
        curve[i] = Math.tanh(x * (1 + k * 0.5));
      } else if (type === 'hard') {
        curve[i] = Math.max(-0.8, Math.min(0.8, x * (1 + k)));
      } else if (type === 'fuzz') {
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      } else {
        // Soft
        curve[i] = ((3 + k) * x * 57 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  public updateSettings(fx: FxSettings) {
    const now = this.ctx.currentTime;

    // EQ
    if (fx.eqEnabled && fx.eqBands) {
      fx.eqBands.forEach((band, idx) => {
        if (this.eqFilters[idx]) {
          this.eqFilters[idx].gain.setTargetAtTime(band.gain, now, 0.05);
          this.eqFilters[idx].frequency.setTargetAtTime(band.frequency, now, 0.05);
          this.eqFilters[idx].Q.setTargetAtTime(band.q, now, 0.05);
        }
      });
    } else {
      this.eqFilters.forEach((f) => f.gain.setTargetAtTime(0, now, 0.05));
    }

    // Filter
    if (fx.filterEnabled) {
      this.resFilter.type = fx.filterType;
      this.resFilter.frequency.setTargetAtTime(fx.filterCutoff, now, 0.05);
      this.resFilter.Q.setTargetAtTime(fx.filterResonance, now, 0.05);
    } else {
      this.resFilter.type = 'lowpass';
      this.resFilter.frequency.setTargetAtTime(20000, now, 0.05);
      this.resFilter.Q.setTargetAtTime(1.0, now, 0.05);
    }

    // Distortion
    this.setDistortion(fx.distortionEnabled, fx.distortionDrive, fx.distortionType, fx.distortionMix);

    // Chorus
    this.setChorus(fx.chorusEnabled, fx.chorusRate, fx.chorusDepth, fx.chorusMix);

    // Delay
    this.setDelay(fx.delayEnabled, fx.delayTime, fx.delayFeedback, fx.delayMix);

    // Reverb
    this.setReverb(fx.reverbEnabled, fx.reverbDecay, fx.reverbMix, fx.reverbDamp);

    // Compressor
    this.setCompressor(
      fx.compressorEnabled,
      fx.compressorThreshold,
      fx.compressorRatio,
      fx.compressorAttack,
      fx.compressorRelease,
      fx.compressorMakeup
    );
  }

  public setDistortion(enabled: boolean, drive: number, type: 'soft' | 'hard' | 'tube' | 'fuzz', mix: number) {
    const now = this.ctx.currentTime;
    if (!enabled || mix <= 0.01) {
      this.distDryGain.gain.setTargetAtTime(1.0, now, 0.05);
      this.distWetGain.gain.setTargetAtTime(0.0, now, 0.05);
      return;
    }
    this.distShaper.curve = this.makeDistortionCurve(drive, type) as unknown as Float32Array<ArrayBuffer>;
    this.distDryGain.gain.setTargetAtTime(1.0 - mix, now, 0.05);
    this.distWetGain.gain.setTargetAtTime(mix, now, 0.05);
  }

  public setChorus(enabled: boolean, rate: number, depth: number, mix: number) {
    const now = this.ctx.currentTime;
    if (!enabled || mix <= 0.01) {
      this.chorusDry.gain.setTargetAtTime(1.0, now, 0.05);
      this.chorusWet.gain.setTargetAtTime(0.0, now, 0.05);
      return;
    }
    this.chorusLfo.frequency.setTargetAtTime(rate, now, 0.05);
    this.chorusLfoGain.gain.setTargetAtTime(depth * 0.005, now, 0.05);
    this.chorusDry.gain.setTargetAtTime(1.0 - mix * 0.5, now, 0.05);
    this.chorusWet.gain.setTargetAtTime(mix, now, 0.05);
  }

  public setDelay(enabled: boolean, time: number, feedback: number, mix: number) {
    const now = this.ctx.currentTime;
    if (!enabled || mix <= 0.01) {
      this.delayDry.gain.setTargetAtTime(1.0, now, 0.05);
      this.delayWet.gain.setTargetAtTime(0.0, now, 0.05);
      return;
    }
    const safeTime = Math.max(0.02, Math.min(1.5, time));
    this.delayNodeL.delayTime.setTargetAtTime(safeTime, now, 0.05);
    this.delayNodeR.delayTime.setTargetAtTime(safeTime * 1.5, now, 0.05);
    this.delayFeedbackL.gain.setTargetAtTime(Math.min(0.9, feedback), now, 0.05);
    this.delayFeedbackR.gain.setTargetAtTime(Math.min(0.9, feedback), now, 0.05);
    this.delayDry.gain.setTargetAtTime(1.0, now, 0.05);
    this.delayWet.gain.setTargetAtTime(mix, now, 0.05);
  }

  public setReverb(enabled: boolean, decay: number, mix: number, damp: number) {
    const now = this.ctx.currentTime;
    if (!enabled || mix <= 0.01) {
      this.reverbDry.gain.setTargetAtTime(1.0, now, 0.05);
      this.reverbWet.gain.setTargetAtTime(0.0, now, 0.05);
      return;
    }
    this.reverbDry.gain.setTargetAtTime(1.0 - mix * 0.3, now, 0.05);
    this.reverbWet.gain.setTargetAtTime(mix, now, 0.05);
  }

  public setCompressor(
    enabled: boolean,
    threshold: number,
    ratio: number,
    attack: number,
    release: number,
    makeup: number
  ) {
    const now = this.ctx.currentTime;
    if (!enabled) {
      this.compressor.threshold.setTargetAtTime(0, now, 0.05);
      this.compressor.ratio.setTargetAtTime(1, now, 0.05);
      this.compressorMakeup.gain.setTargetAtTime(1.0, now, 0.05);
      return;
    }
    this.compressor.threshold.setTargetAtTime(threshold, now, 0.05);
    this.compressor.ratio.setTargetAtTime(ratio, now, 0.05);
    this.compressor.attack.setTargetAtTime(attack, now, 0.05);
    this.compressor.release.setTargetAtTime(release, now, 0.05);
    const linearMakeup = Math.pow(10, makeup / 20);
    this.compressorMakeup.gain.setTargetAtTime(linearMakeup, now, 0.05);
  }

  public setImpulseBuffer(buffer: AudioBuffer) {
    this.reverbConvolver.buffer = buffer;
  }
}
