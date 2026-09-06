import { DrumSoundId, DrumKitId } from '../types/daw';

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
    customAudioUrl?: string,
    kitId: DrumKitId = 'trap'
  ) {
    if (customAudioUrl && this.customBuffers.has(customAudioUrl)) {
      this.playCustomSample(customAudioUrl, time, velocity, destination);
      return;
    }

    switch (soundId) {
      case 'kick':
        this.playKick(time, velocity, destination, kitId);
        break;
      case '808':
        this.play808(time, velocity, destination, kitId);
        break;
      case 'snare':
        this.playSnare(time, velocity, destination, kitId);
        break;
      case 'clap':
        this.playClap(time, velocity, destination, kitId);
        break;
      case 'hihat_closed':
        this.playClosedHiHat(time, velocity, destination, kitId);
        break;
      case 'hihat_open':
        this.playOpenHiHat(time, velocity, destination, kitId);
        break;
      case 'tom':
        this.playTom(time, velocity, destination, kitId);
        break;
      case 'rim':
        this.playRim(time, velocity, destination, kitId);
        break;
      case 'crash':
        this.playCrash(time, velocity, destination, kitId);
        break;
      case 'fx':
        this.playFx(time, velocity, destination, kitId);
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

  // --- KICK DRUM ---
  private playKick(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = kitId === 'glitch' ? 'square' : 'sine';

    let startFreq = 160;
    let midFreq = 48;
    let endFreq = 34;
    let decayTime = 0.38;

    if (kitId === 'synthwave') {
      startFreq = 180;
      midFreq = 58;
      endFreq = 42;
      decayTime = 0.28;
    } else if (kitId === 'lofi') {
      startFreq = 120;
      midFreq = 42;
      endFreq = 30;
      decayTime = 0.45;
    } else if (kitId === 'house') {
      startFreq = 150;
      midFreq = 52;
      endFreq = 40;
      decayTime = 0.32;
    } else if (kitId === 'acoustic') {
      startFreq = 140;
      midFreq = 54;
      endFreq = 38;
      decayTime = 0.42;
    }

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(midFreq, time + 0.07);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + decayTime);

    // Click transient
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(kitId === 'lofi' ? 250 : 500, time);
    clickGain.gain.setValueAtTime(0.4 * velocity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
    clickOsc.connect(clickGain);
    clickGain.connect(destination);
    clickOsc.start(time);
    clickOsc.stop(time + 0.02);

    // Amplitude envelope
    gain.gain.setValueAtTime(1.1 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + decayTime + 0.05);
  }

  // --- 808 BASS ---
  private play808(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = kitId === 'glitch' ? 85 : 68;
    const endFreq = kitId === 'synthwave' ? 48 : 38;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.06);

    gain.gain.setValueAtTime(1.05 * velocity, time);
    gain.gain.setValueAtTime(0.9 * velocity, time + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 1.3);
  }

  // --- SNARE DRUM ---
  private playSnare(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(kitId === 'synthwave' ? 260 : 210, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.08);

    oscGain.gain.setValueAtTime(0.7 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.22);

    // Noise wire rattle
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = kitId === 'synthwave' ? 'lowpass' : 'highpass';
      filter.frequency.setValueAtTime(kitId === 'synthwave' ? 5000 : 1200, time);

      const noiseGain = this.ctx.createGain();
      const decay = kitId === 'synthwave' ? 0.38 : 0.22; // 80s gated snare sustain
      noiseGain.gain.setValueAtTime(0.95 * velocity, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(destination);

      noise.start(time);
      noise.stop(time + decay + 0.05);
    }
  }

  // --- HAND CLAP ---
  private playClap(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    if (!this.noiseBuffer) return;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(kitId === 'lofi' ? 950 : 1250, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = this.ctx.createGain();
    filter.connect(gain);
    gain.connect(destination);

    // 3 rapid mini-bursts
    const bursts = [0, 0.012, 0.024];
    bursts.forEach((offset) => {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const burstGain = this.ctx.createGain();
      burstGain.gain.setValueAtTime(0.65 * velocity, time + offset);
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
    mainGain.gain.setValueAtTime(0.9 * velocity, time + 0.03);
    mainGain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
    mainNoise.connect(mainGain);
    mainGain.connect(filter);
    mainNoise.start(time + 0.03);
    mainNoise.stop(time + 0.35);
  }

  // --- CLOSED HI-HAT ---
  private playClosedHiHat(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(kitId === 'lofi' ? 5500 : 7800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.75 * velocity, time);
    const decay = kitId === 'trap' ? 0.045 : 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + decay + 0.01);
  }

  // --- OPEN HI-HAT ---
  private playOpenHiHat(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(kitId === 'lofi' ? 4800 : 6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + 0.45);
  }

  // --- TOM ---
  private playTom(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = kitId === 'synthwave' ? 220 : 160;
    const endFreq = kitId === 'synthwave' ? 90 : 70;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.24);

    gain.gain.setValueAtTime(0.9 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.4);
  }

  // --- RIMSHOT ---
  private playRim(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(kitId === 'glitch' ? 950 : 650, time);
    osc.frequency.exponentialRampToValueAtTime(360, time + 0.04);

    gain.gain.setValueAtTime(0.85 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // --- CRASH CYMBAL ---
  private playCrash(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    if (!this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(4500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + 1.6);
  }

  // --- PERCUSSION FX ---
  private playFx(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(kitId === 'glitch' ? 1200 : 850, time);
    osc.frequency.exponentialRampToValueAtTime(100, time + 0.28);

    gain.gain.setValueAtTime(0.65 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.35);
  }
}
