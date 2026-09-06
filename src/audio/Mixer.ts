import { EffectsChain } from './EffectsChain';
import { FxSettings } from '../types/daw';

export class MixerChannelNode {
  public index: number;
  public inputNode: GainNode;
  public effectsChain: EffectsChain;
  public volumeNode: GainNode;
  public panNode: StereoPannerNode;
  public muteNode: GainNode;
  public analyserNode: AnalyserNode;
  private pcmData: Float32Array;

  constructor(ctx: AudioContext, index: number) {
    this.index = index;
    this.inputNode = ctx.createGain();
    this.effectsChain = new EffectsChain(ctx);
    this.volumeNode = ctx.createGain();
    this.panNode = ctx.createStereoPanner();
    this.muteNode = ctx.createGain();
    this.analyserNode = ctx.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.analyserNode.smoothingTimeConstant = 0.8;
    this.pcmData = new Float32Array(this.analyserNode.frequencyBinCount);

    // Flow: input -> effectsChain -> volume -> pan -> mute -> analyser
    this.inputNode.connect(this.effectsChain.inputNode);
    this.effectsChain.outputNode.connect(this.volumeNode);
    this.volumeNode.connect(this.panNode);
    this.panNode.connect(this.muteNode);
    this.muteNode.connect(this.analyserNode);
  }

  public setVolume(vol: number, ctx: AudioContext) {
    // vol: 0.0 to 1.25
    this.volumeNode.gain.setTargetAtTime(vol, ctx.currentTime, 0.02);
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

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    // Master Limiter to prevent clipping
    this.masterLimiter = ctx.createDynamicsCompressor();
    this.masterLimiter.threshold.setValueAtTime(-0.5, ctx.currentTime);
    this.masterLimiter.knee.setValueAtTime(0, ctx.currentTime);
    this.masterLimiter.ratio.setValueAtTime(20, ctx.currentTime);
    this.masterLimiter.attack.setValueAtTime(0.001, ctx.currentTime);
    this.masterLimiter.release.setValueAtTime(0.05, ctx.currentTime);
    this.masterLimiter.connect(destination);

    // Master Channel (Index 0)
    this.masterChannel = new MixerChannelNode(ctx, 0);
    this.masterChannel.analyserNode.connect(this.masterLimiter);

    // 8 Insert Channels (Index 1 to 8)
    for (let i = 1; i <= 8; i++) {
      const channel = new MixerChannelNode(ctx, i);
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
