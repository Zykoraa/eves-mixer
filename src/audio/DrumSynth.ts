import { DrumSoundId } from '../types/daw';

export class DrumSynth {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;
  private customBuffers: Map<string, AudioBuffer> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.generateNoiseBuffer();
  }

  private generateNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public registerCustomSample(url: string, buffer: AudioBuffer) {
    this.customBuffers.set(url, buffer);
  }

  public async loadAudioFile(file: File): Promise<{ url: string; buffer: AudioBuffer }> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    const url = URL.createObjectURL(file);
    this.registerCustomSample(url, audioBuffer);
    return { url, buffer: audioBuffer };
  }

  public trigger(
    soundId: DrumSoundId,
    time: number,
    velocity: number = 1.0,
    destination: AudioNode,
    customAudioUrl?: string
  ) {
    if (customAudioUrl && this.customBuffers.has(customAudioUrl)) {
      this.playCustomSample(customAudioUrl, time, velocity, destination);
      return;
    }

    switch (soundId) {
      case 'kick':
        this.playKick(time, velocity, destination);
        break;
      case '808':
        this.play808(time, velocity, destination);
        break;
      case 'snare':
        this.playSnare(time, velocity, destination);
        break;
      case 'clap':
        this.playClap(time, velocity, destination);
        break;
      case 'hihat_closed':
        this.playClosedHiHat(time, velocity, destination);
        break;
      case 'hihat_open':
        this.playOpenHiHat(time, velocity, destination);
        break;
      case 'tom':
        this.playTom(time, velocity, destination);
        break;
      case 'rim':
        this.playRim(time, velocity, destination);
        break;
      case 'crash':
        this.playCrash(time, velocity, destination);
        break;
      case 'fx':
        this.playFx(time, velocity, destination);
        break;
    }
  }

  private playCustomSample(url: string, time: number, velocity: number, destination: AudioNode) {
    const buffer = this.customBuffers.get(url);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, time);
    source.connect(gain);
    gain.connect(destination);
    source.start(time);
  }

  // Punchy Electronic Kick
  private playKick(time: number, velocity: number, destination: AudioNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Pitch envelope: fast drop from 160Hz to 40Hz
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.35);

    // Click transient
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(400, time);
    clickGain.gain.setValueAtTime(0.4 * velocity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
    clickOsc.connect(clickGain);
    clickGain.connect(destination);
    clickOsc.start(time);
    clickOsc.stop(time + 0.02);

    // Amplitude envelope
    gain.gain.setValueAtTime(1.1 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.45);
  }

  // Deep Sustained 808 Sub-bass
  private play808(time: number, velocity: number, destination: AudioNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.06);

    gain.gain.setValueAtTime(1.0 * velocity, time);
    gain.gain.setValueAtTime(0.85 * velocity, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.9);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 1.0);
  }

  // Snappy Snare with body and rattle
  private playSnare(time: number, velocity: number, destination: AudioNode) {
    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.08);

    oscGain.gain.setValueAtTime(0.7 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.2);

    // Noise wire rattle
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9 * velocity, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);

      noise.start(time);
      noise.stop(time + 0.25);
    }
  }

  // Multi-burst Hand Clap
  private playClap(time: number, velocity: number, destination: AudioNode) {
    if (!this.noiseBuffer) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, time);
    filter.Q.setValueAtTime(1.5, time);

    const gain = this.ctx.createGain();
    filter.connect(gain);
    gain.connect(destination);

    // 3 rapid mini-bursts (simulating multiple hands clapping)
    const bursts = [0, 0.012, 0.024];
    bursts.forEach((offset) => {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const burstGain = this.ctx.createGain();
      burstGain.gain.setValueAtTime(0.6 * velocity, time + offset);
      burstGain.gain.exponentialRampToValueAtTime(0.001, time + offset + 0.015);
      noise.connect(burstGain);
      burstGain.connect(filter);
      noise.start(time + offset);
      noise.stop(time + offset + 0.02);
    });

    // Main tail
    const mainNoise = this.ctx.createBufferSource();
    mainNoise.buffer = this.noiseBuffer;
    const mainGain = this.ctx.createGain();
    mainGain.gain.setValueAtTime(0.85 * velocity, time + 0.03);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
    mainNoise.connect(mainGain);
    mainGain.connect(filter);
    mainNoise.start(time + 0.03);
    mainNoise.stop(time + 0.35);
  }

  // Closed Hi-Hat (Crisp and tight)
  private playClosedHiHat(time: number, velocity: number, destination: AudioNode) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.055);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  // Open Hi-Hat (Sustained metallic sizzle)
  private playOpenHiHat(time: number, velocity: number, destination: AudioNode) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.75 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + 0.45);
  }

  // Tuned Tom
  private playTom(time: number, velocity: number, destination: AudioNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(75, time + 0.25);

    gain.gain.setValueAtTime(0.9 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  // Resonant Rimshot
  private playRim(time: number, velocity: number, destination: AudioNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, time);
    osc.frequency.exponentialRampToValueAtTime(350, time + 0.04);

    gain.gain.setValueAtTime(0.8 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // Shimmering Crash Cymbal
  private playCrash(time: number, velocity: number, destination: AudioNode) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + 1.5);
  }

  // Glitch Transition FX
  private playFx(time: number, velocity: number, destination: AudioNode) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.3);

    gain.gain.setValueAtTime(0.6 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.4);
  }
}
