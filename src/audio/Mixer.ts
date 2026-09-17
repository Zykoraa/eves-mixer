import { EffectsChain } from './EffectsChain';
import { FxSettings } from '../types/daw';
import { GrossBeatEngine } from './GrossBeatEngine';
import { TapeColorEngine } from './TapeColorEngine';
import { MasteringSuite } from './MasteringSuite';

export class MixerChannelNode {
  public index: number;
  public inputNode: GainNode;
  public effectsChain: EffectsChain;
  public volumeNode: GainNode;
  public panNode: StereoPannerNode;
  public sidechainGainNode: GainNode;
  public sidechainShelfNode: BiquadFilterNode;
  public muteNode: GainNode;
  public analyserNode: AnalyserNode;
  private pcmData: Float32Array;

  constructor(ctx: AudioContext, index: number) {
    this.index = index;
    this.inputNode = ctx.createGain();
    this.effectsChain = new EffectsChain(ctx);
    this.volumeNode = ctx.createGain();
    this.panNode = ctx.createStereoPanner();
    this.sidechainGainNode = ctx.createGain();
    this.sidechainShelfNode = ctx.createBiquadFilter();
    this.sidechainShelfNode.type = 'lowshelf';
    this.sidechainShelfNode.frequency.setValueAtTime(130, ctx.currentTime);
    this.sidechainShelfNode.gain.setValueAtTime(0, ctx.currentTime);
    this.muteNode = ctx.createGain();
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;
    this.pcmData = new Float32Array(this.analyserNode.frequencyBinCount);

    // Flow: input -> effectsChain -> volume -> pan -> sidechainGain -> sidechainShelf -> mute -> analyser
    this.inputNode.connect(this.effectsChain.inputNode);
    this.effectsChain.outputNode.connect(this.volumeNode);
    this.volumeNode.connect(this.panNode);
    this.panNode.connect(this.sidechainGainNode);
    this.sidechainGainNode.connect(this.sidechainShelfNode);
    this.sidechainShelfNode.connect(this.muteNode);
    this.muteNode.connect(this.analyserNode);
  }

  public setVolume(vol: number, ctx: AudioContext) {
    if (this.index === 0) {
      // Master Channel: Perceptual cubic audio taper (vol^2.6) with calibrated studio headroom (0.55)
      // Prevents ear-splitting blasts caused by linear gain scaling.
      // 50% is now a comfortable listening level (~ -21 dB), 70% is standard studio level (~ -13 dB),
      // and smooth volume control is restored across the entire 0% to 100% slider throw.
      const clamped = Math.max(0, Math.min(1.0, vol));
      if (clamped <= 0.001) {
        this.volumeNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.015);
        return;
      }
      const audioTaperGain = Math.pow(clamped, 2.6) * 0.55;
      this.volumeNode.gain.setTargetAtTime(audioTaperGain, ctx.currentTime, 0.02);
    } else {
      // Insert Channel: Quadratic curve with headroom
      const clamped = Math.max(0, Math.min(1.5, vol));
      if (clamped <= 0.001) {
        this.volumeNode.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.015);
        return;
      }
      const audioTaperGain = Math.pow(clamped, 1.8) * 0.8;
      this.volumeNode.gain.setTargetAtTime(audioTaperGain, ctx.currentTime, 0.02);
    }
  }

  public setPan(pan: number, ctx: AudioContext) {
    // pan: -1.0 to 1.0
    this.panNode.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime, 0.02);
  }

  public setMute(muted: boolean, ctx: AudioContext) {
    this.muteNode.gain.setTargetAtTime(muted ? 0.0001 : 1.0, ctx.currentTime, 0.02);
  }

  public updateEffects(fx: FxSettings) {
    this.effectsChain.updateSettings(fx);
  }

  public getPeak(): number {
    this.analyserNode.getFloatTimeDomainData(this.pcmData as unknown as Float32Array<ArrayBuffer>);
    let max = 0;
    for (let i = 0; i < this.pcmData.length; i++) {
      const abs = Math.abs(this.pcmData[i]);
      if (abs > max) max = abs;
    }
    return Math.min(1.0, max);
  }
}

export class Mixer {
  private ctx: AudioContext;
  public masterChannel: MixerChannelNode;
  public insertChannels: MixerChannelNode[] = [];
  public masterLimiter: DynamicsCompressorNode;
  public masterSoftClipper: WaveShaperNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    // Modeled Fruity Soft Clipper (Analog hyperbolic saturation)
    this.masterSoftClipper = ctx.createWaveShaper();
    const clipSamples = 1024;
    const clipCurve = new Float32Array(clipSamples);
    for (let i = 0; i < clipSamples; i++) {
      const x = (i * 2) / clipSamples - 1;
      clipCurve[i] = Math.tanh(x * 1.35) / Math.tanh(1.35);
    }
    this.masterSoftClipper.curve = clipCurve as unknown as Float32Array<ArrayBuffer>;
    this.masterSoftClipper.oversample = '2x';

    // Master Safety Limiter with smooth transparent leveling (No harsh pumping)
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-0.2, ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(6.0, ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(10, ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.005, ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.12, ctx.currentTime);

    this.masterSoftClipper.connect(this.masterLimiter);
    this.masterLimiter.connect(destination);

    // Master Channel (Index 0)
    this.masterChannel = new MixerChannelNode(ctx, 0);
    this.masterChannel.setVolume(0.70, ctx);

    // Wire Master FX Processors: Gross Beat -> Tape Color -> Mastering Suite
    const grossBeat = GrossBeatEngine.getInstance();
    grossBeat.init(ctx);

    const tapeColor = TapeColorEngine.getInstance();
    tapeColor.init(ctx);

    const mastering = MasteringSuite.getInstance();
    mastering.init(ctx);

    // masterChannel -> grossBeat
    if (grossBeat.inputNode && grossBeat.outputNode) {
      this.masterChannel.analyserNode.connect(grossBeat.inputNode);
    } else {
      this.masterChannel.analyserNode.connect(this.masterSoftClipper);
    }

    // grossBeat -> tapeColor
    if (grossBeat.outputNode && tapeColor.inputNode) {
      grossBeat.outputNode.connect(tapeColor.inputNode);
    }

    // tapeColor -> mastering
    if (tapeColor.outputNode && mastering.inputNode) {
      tapeColor.outputNode.connect(mastering.inputNode);
    }

    // mastering -> soft clipper
    if (mastering.outputNode) {
      mastering.outputNode.connect(this.masterSoftClipper);
    } else if (tapeColor.outputNode) {
      tapeColor.outputNode.connect(this.masterSoftClipper);
    }

    // 8 Insert Channels (Index 1 to 8)
    for (let i = 1; i <= 8; i++) {
      const channel = new MixerChannelNode(ctx, i);
      channel.setVolume(0.85, ctx);
      // Route insert output to master channel input
      channel.analyserNode.connect(this.masterChannel.inputNode);
      this.insertChannels.push(channel);
    }
  }

  public getChannel(index: number): MixerChannelNode {
    if (index === 0) return this.masterChannel;
    const insertIdx = index - 1;
    if (insertIdx >= 0 && insertIdx < this.insertChannels.length) {
      return this.insertChannels[insertIdx];
    }
    return this.masterChannel;
  }

  public getAllPeaks(): number[] {
    const peaks = [this.masterChannel.getPeak()];
    for (const ch of this.insertChannels) {
      peaks.push(ch.getPeak());
    }
    return peaks;
  }
}
