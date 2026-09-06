import { DrumSoundId, DrumKitId } from '../types/daw';

export class DrumSynth {
  private ctx: AudioContext;
  private noiseBuffer: AudioBuffer | null = null;
  private customBuffers: Map<string, AudioBuffer> = new Map();
  private softClipCurve: Float32Array<ArrayBuffer>;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.generateNoiseBuffer();
    this.softClipCurve = this.generateSoftClipCurve(2.2);
  }

  // Generate 2 seconds of decorrelated noise for snares, claps, and shimmer
  private generateNoiseBuffer() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let i = 0; i < bufferSize; i++) {
      left[i] = Math.random() * 2 - 1;
      right[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  // Modeled Fruity Soft Clipper transfer curve for analog punch and punchy saturation
  private generateSoftClipCurve(drive: number = 2.0): Float32Array<ArrayBuffer> {
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Hyperbolic tangent soft saturation with threshold
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    return curve as unknown as Float32Array<ArrayBuffer>;
  }

  // Create an in-line soft-clipper waveshaper node
  private createSoftClipper(driveAmount: number = 1.8): WaveShaperNode {
    const shaper = this.ctx.createWaveShaper();
    shaper.curve = (driveAmount === 2.2 ? this.softClipCurve : this.generateSoftClipCurve(driveAmount)) as unknown as Float32Array<ArrayBuffer>;
    shaper.oversample = '2x';
    return shaper;
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
    kitId: DrumKitId = 'trap',
    pitchOffset: number = 0
  ) {
    if (customAudioUrl && this.customBuffers.has(customAudioUrl)) {
      this.playCustomSample(customAudioUrl, time, velocity, destination, pitchOffset);
      return;
    }

    const safeVel = Math.max(0.05, Math.min(1.4, velocity));

    switch (soundId) {
      case 'kick':
        this.playProKick(time, safeVel, destination, kitId, pitchOffset);
        break;
      case '808':
        this.playPro808(time, safeVel, destination, kitId, pitchOffset);
        break;
      case 'snare':
        this.playProSnare(time, safeVel, destination, kitId);
        break;
      case 'clap':
        this.playProClap(time, safeVel, destination, kitId);
        break;
      case 'hihat_closed':
        this.playProClosedHiHat(time, safeVel, destination, kitId, pitchOffset);
        break;
      case 'hihat_open':
        this.playProOpenHiHat(time, safeVel, destination, kitId);
        break;
      case 'tom':
        this.playProTom(time, safeVel, destination, kitId, pitchOffset);
        break;
      case 'rim':
        this.playProRim(time, safeVel, destination, kitId);
        break;
      case 'crash':
        this.playProCrash(time, safeVel, destination, kitId);
        break;
      case 'fx':
        this.playProFx(time, safeVel, destination, kitId, pitchOffset);
        break;
    }
  }

  private playCustomSample(url: string, time: number, velocity: number, destination: AudioNode, pitchOffset: number = 0) {
    const buffer = this.customBuffers.get(url);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    if (pitchOffset !== 0) {
      source.playbackRate.setValueAtTime(Math.pow(2, pitchOffset / 12), time);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(velocity, time);
    source.connect(gain);
    gain.connect(destination);
    source.start(time);
  }

  // =========================================================================
  // 1. PRO KICK DRUM — Multi-Layer Transient + Sub Punch + Soft Clipper
  // =========================================================================
  private playProKick(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId, pitchOffset: number = 0) {
    const pitchMultiplier = Math.pow(2, pitchOffset / 12);

    // Node graph: [Body Osc + Transient Click + Beater Snap] -> Sub Filter -> Soft Clipper -> Destination
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    const clipper = this.createSoftClipper(kitId === 'trap' ? 2.4 : 1.9);

    let startFreq = 220 * pitchMultiplier;
    let punchFreq = 54 * pitchMultiplier;
    let subFreq = 34 * pitchMultiplier;
    let decayTime = 0.42;
    let clickFreq = 3200;

    if (kitId === 'synthwave') {
      // 80s LinnDrum heavy acoustic punch
      startFreq = 260 * pitchMultiplier;
      punchFreq = 65 * pitchMultiplier;
      subFreq = 46 * pitchMultiplier;
      decayTime = 0.32;
      clickFreq = 2800;
    } else if (kitId === 'lofi') {
      // Warm dusty boom bap kick with round low-end
      startFreq = 145 * pitchMultiplier;
      punchFreq = 48 * pitchMultiplier;
      subFreq = 32 * pitchMultiplier;
      decayTime = 0.48;
      clickFreq = 1400;
    } else if (kitId === 'house') {
      // Classic 909 punch kick with tight thump
      startFreq = 180 * pitchMultiplier;
      punchFreq = 56 * pitchMultiplier;
      subFreq = 42 * pitchMultiplier;
      decayTime = 0.34;
      clickFreq = 3800;
    } else if (kitId === 'acoustic') {
      // Live studio kick with wooden beater attack
      startFreq = 165 * pitchMultiplier;
      punchFreq = 52 * pitchMultiplier;
      subFreq = 36 * pitchMultiplier;
      decayTime = 0.38;
      clickFreq = 2200;
    } else if (kitId === 'glitch') {
      bodyOsc.type = 'sawtooth';
      startFreq = 340 * pitchMultiplier;
      punchFreq = 70 * pitchMultiplier;
      subFreq = 40 * pitchMultiplier;
      decayTime = 0.28;
      clickFreq = 5000;
    } else {
      // Trap Heat: Aggressive pitch drop from 240Hz down to sub
      startFreq = 240 * pitchMultiplier;
      punchFreq = 52 * pitchMultiplier;
      subFreq = 33 * pitchMultiplier;
      decayTime = 0.44;
      clickFreq = 3600;
    }

    // 1. Sub Body Pitch Envelope (Fast initial dive for punch, then smooth sub tail)
    bodyOsc.frequency.setValueAtTime(startFreq, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(punchFreq, time + 0.038);
    bodyOsc.frequency.exponentialRampToValueAtTime(subFreq, time + decayTime);

    // 2. Amplitude Envelope
    bodyGain.gain.setValueAtTime(1.25 * velocity, time);
    bodyGain.gain.setValueAtTime(1.15 * velocity, time + 0.04);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + decayTime);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(clipper);

    // 3. Transient Beater Click (Crucial for cutting through phone/laptop speakers)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    const clickFilter = this.ctx.createBiquadFilter();

    clickOsc.type = kitId === 'synthwave' ? 'sawtooth' : 'triangle';
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(clickFreq, time);
    clickFilter.Q.setValueAtTime(3.5, time);

    clickOsc.frequency.setValueAtTime(clickFreq, time);
    clickOsc.frequency.exponentialRampToValueAtTime(300, time + 0.012);

    clickGain.gain.setValueAtTime(0.55 * velocity, time);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.018);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(clipper);

    clipper.connect(destination);

    bodyOsc.start(time);
    bodyOsc.stop(time + decayTime + 0.05);
    clickOsc.start(time);
    clickOsc.stop(time + 0.025);
  }

  // =========================================================================
  // 2. PRO 808 SUB BASS — Harmonic Saturation + Pitch Dive + Massive Rumble
  // =========================================================================
  private playPro808(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId, pitchOffset: number = 0) {
    const osc = this.ctx.createOscillator();
    const harmOsc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    const harmGain = this.ctx.createGain();
    const lpf = this.ctx.createBiquadFilter();
    const clipper = this.createSoftClipper(kitId === 'glitch' ? 3.2 : 2.5);

    // Base pitch calculation (default ~38.89 Hz = D#1 / E1 base)
    const baseFreq = 41.2 * Math.pow(2, pitchOffset / 12);
    const startFreq = baseFreq * 2.8;

    // Pitch Envelope (fast dive creates the iconic punch before long sub sustain)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.045);

    // 2nd Harmonic oscillator (gives warmth on small phone speakers/headphones)
    harmOsc.type = 'triangle';
    harmOsc.frequency.setValueAtTime(startFreq * 2, time);
    harmOsc.frequency.exponentialRampToValueAtTime(baseFreq * 2, time + 0.045);

    // Lowpass filter to retain thick punch and roll off harshness above 450Hz
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(kitId === 'synthwave' ? 600 : 380, time);
    lpf.Q.setValueAtTime(1.4, time);

    const sustainTime = kitId === 'synthwave' ? 0.9 : 1.4;

    oscGain.gain.setValueAtTime(1.2 * velocity, time);
    oscGain.gain.setValueAtTime(1.1 * velocity, time + 0.08);
    oscGain.gain.setValueAtTime(0.85 * velocity, time + 0.45);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + sustainTime);

    harmGain.gain.setValueAtTime(0.35 * velocity, time);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.7);

    osc.connect(oscGain);
    harmOsc.connect(harmGain);

    oscGain.connect(lpf);
    harmGain.connect(lpf);
    lpf.connect(clipper);
    clipper.connect(destination);

    osc.start(time);
    osc.stop(time + sustainTime + 0.05);
    harmOsc.start(time);
    harmOsc.stop(time + 0.75);
  }

  // =========================================================================
  // 3. PRO SNARE — Dual-Oscillator Shell Body + Sizzling Wire Crack + Gate
  // =========================================================================
  private playProSnare(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const clipper = this.createSoftClipper(2.1);

    // 1. Tonal Shell Body (Dual tuned oscillators for solid mid-range crack)
    const bodyOsc1 = this.ctx.createOscillator();
    const bodyOsc2 = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();

    const baseBodyFreq = kitId === 'synthwave' ? 240 : kitId === 'lofi' ? 180 : 205;
    bodyOsc1.type = 'triangle';
    bodyOsc2.type = 'sine';

    bodyOsc1.frequency.setValueAtTime(baseBodyFreq * 1.8, time);
    bodyOsc1.frequency.exponentialRampToValueAtTime(baseBodyFreq, time + 0.04);

    bodyOsc2.frequency.setValueAtTime(baseBodyFreq * 2.2, time);
    bodyOsc2.frequency.exponentialRampToValueAtTime(baseBodyFreq * 1.4, time + 0.035);

    bodyGain.gain.setValueAtTime(0.9 * velocity, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);

    bodyOsc1.connect(bodyGain);
    bodyOsc2.connect(bodyGain);
    bodyGain.connect(clipper);

    bodyOsc1.start(time);
    bodyOsc1.stop(time + 0.18);
    bodyOsc2.start(time);
    bodyOsc2.stop(time + 0.18);

    // 2. Snare Wire Sizzle & Crack (Shaped stereo noise burst with bandpass boost)
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const hpf = this.ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.setValueAtTime(kitId === 'lofi' ? 900 : 1600, time);

      const bpf = this.ctx.createBiquadFilter();
      bpf.type = 'peaking';
      bpf.frequency.setValueAtTime(kitId === 'synthwave' ? 4200 : 3800, time);
      bpf.gain.setValueAtTime(6.0, time);
      bpf.Q.setValueAtTime(1.5, time);

      const noiseGain = this.ctx.createGain();
      // 80s gated snare sustain vs tight modern trap snap
      const noiseDecay = kitId === 'synthwave' ? 0.38 : kitId === 'lofi' ? 0.28 : 0.22;

      noiseGain.gain.setValueAtTime(1.1 * velocity, time);
      noiseGain.gain.setValueAtTime(0.85 * velocity, time + 0.04);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + noiseDecay);

      noise.connect(hpf);
      hpf.connect(bpf);
      bpf.connect(noiseGain);
      noiseGain.connect(clipper);

      noise.start(time);
      noise.stop(time + noiseDecay + 0.02);
    }

    clipper.connect(destination);
  }

  // =========================================================================
  // 4. PRO HAND CLAP — Humanized Multi-Flam Burst + Resonant Body + Room Tail
  // =========================================================================
  private playProClap(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    if (!this.noiseBuffer) return;

    const clipper = this.createSoftClipper(1.8);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(kitId === 'lofi' ? 980 : 1250, time);
    filter.Q.setValueAtTime(2.2, time);

    // 4 micro-flam burst offsets to emulate real group hand claps
    const flams = [0, 0.009, 0.019, 0.031];
    flams.forEach((offset, idx) => {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const flamGain = this.ctx.createGain();
      const flamAmp = idx === 3 ? 0.95 : 0.6 + idx * 0.1;
      flamGain.gain.setValueAtTime(flamAmp * velocity, time + offset);
      flamGain.gain.exponentialRampToValueAtTime(0.0001, time + offset + 0.014);

      noise.connect(flamGain);
      flamGain.connect(filter);

      noise.start(time + offset);
      noise.stop(time + offset + 0.018);
    });

    // Reverberant Clap Body & Tail
    const tailNoise = this.ctx.createBufferSource();
    tailNoise.buffer = this.noiseBuffer;
    const tailGain = this.ctx.createGain();
    const decay = kitId === 'synthwave' ? 0.36 : 0.28;

    tailGain.gain.setValueAtTime(1.05 * velocity, time + 0.032);
    tailGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    tailNoise.connect(tailGain);
    tailGain.connect(filter);

    tailNoise.start(time + 0.032);
    tailNoise.stop(time + decay + 0.03);

    filter.connect(clipper);
    clipper.connect(destination);
  }

  // =========================================================================
  // 5. PRO HI-HATS — Roland TR-808/909 6-Oscillator Metallic Bank + Dynamic Velocity
  // =========================================================================
  private playProClosedHiHat(
    time: number,
    velocity: number,
    destination: AudioNode,
    kitId: DrumKitId,
    pitchOffset: number = 0
  ) {
    const pitchMult = Math.pow(2, pitchOffset / 12);
    // Roland TR-808/909 iconic dissonant metallic frequency cluster:
    const metalFreqs = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0];

    const metalSumGain = this.ctx.createGain();
    metalSumGain.gain.setValueAtTime(0.22, time);

    const oscs: OscillatorNode[] = [];
    metalFreqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq * pitchMult * (kitId === 'lofi' ? 0.85 : 1.0), time);
      osc.connect(metalSumGain);
      oscs.push(osc);
    });

    // Bandpass + Highpass shaping gives realistic bronze cymbal shimmer
    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(kitId === 'lofi' ? 6500 : 8200, time);
    bpf.Q.setValueAtTime(2.4, time);

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    // Dynamic brightness: higher velocity opens the filter for natural expression
    hpf.frequency.setValueAtTime(6500 + velocity * 1500, time);

    const envGain = this.ctx.createGain();
    const decay = kitId === 'trap' ? 0.045 : kitId === 'lofi' ? 0.07 : 0.055;

    envGain.gain.setValueAtTime(0.95 * velocity, time);
    envGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    metalSumGain.connect(bpf);
    bpf.connect(hpf);
    hpf.connect(envGain);

    // Subtle noise layer for top-end air
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28 * velocity, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
      noise.connect(hpf);
      noise.start(time);
      noise.stop(time + decay + 0.01);
    }

    envGain.connect(destination);

    oscs.forEach((osc) => {
      osc.start(time);
      osc.stop(time + decay + 0.02);
    });
  }

  // =========================================================================
  // 6. PRO OPEN HI-HAT — Metallic Sizzle Wash & Smooth Ring
  // =========================================================================
  private playProOpenHiHat(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const metalFreqs = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0];
    const metalSumGain = this.ctx.createGain();
    metalSumGain.gain.setValueAtTime(0.18, time);

    const oscs: OscillatorNode[] = [];
    metalFreqs.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq * (kitId === 'lofi' ? 0.9 : 1.05), time);
      osc.connect(metalSumGain);
      oscs.push(osc);
    });

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(kitId === 'lofi' ? 5500 : 7200, time);
    bpf.Q.setValueAtTime(1.8, time);

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(5800, time);

    const envGain = this.ctx.createGain();
    const decay = kitId === 'synthwave' ? 0.52 : kitId === 'lofi' ? 0.35 : 0.45;

    envGain.gain.setValueAtTime(0.9 * velocity, time);
    envGain.gain.setValueAtTime(0.7 * velocity, time + 0.08);
    envGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    metalSumGain.connect(bpf);
    bpf.connect(hpf);
    hpf.connect(envGain);

    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * velocity, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
      noise.connect(hpf);
      noise.start(time);
      noise.stop(time + decay + 0.02);
    }

    envGain.connect(destination);

    oscs.forEach((osc) => {
      osc.start(time);
      osc.stop(time + decay + 0.03);
    });
  }

  // =========================================================================
  // 7. PRO TOM — Resonant Acoustic Pitch Dive + Drum Head Beater
  // =========================================================================
  private playProTom(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId, pitchOffset: number = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const clipper = this.createSoftClipper(1.6);

    const pitchMult = Math.pow(2, pitchOffset / 12);
    const startFreq = (kitId === 'synthwave' ? 240 : 180) * pitchMult;
    const endFreq = (kitId === 'synthwave' ? 85 : 65) * pitchMult;

    osc.type = kitId === 'synthwave' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.18);

    gain.gain.setValueAtTime(1.1 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);

    osc.connect(gain);
    gain.connect(clipper);
    clipper.connect(destination);

    osc.start(time);
    osc.stop(time + 0.42);
  }

  // =========================================================================
  // 8. PRO RIMSHOT / CROSS-STICK — Acoustic Wood Shell Knock
  // =========================================================================
  private playProRim(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    const bpf = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(kitId === 'glitch' ? 1400 : 880, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.035);

    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1800, time);
    bpf.Q.setValueAtTime(4.0, time);

    oscGain.gain.setValueAtTime(1.15 * velocity, time);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.055);

    osc.connect(bpf);
    bpf.connect(oscGain);
    oscGain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // =========================================================================
  // 9. PRO CRASH CYMBAL — Colossal Metallic Wash & Long Shimmer
  // =========================================================================
  private playProCrash(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId) {
    if (!this.noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const hpf = this.ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.setValueAtTime(kitId === 'lofi' ? 3800 : 4800, time);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'peaking';
    bpf.frequency.setValueAtTime(9500, time);
    bpf.gain.setValueAtTime(4.0, time);

    const gain = this.ctx.createGain();
    const decay = kitId === 'synthwave' ? 2.2 : 1.8;
    gain.gain.setValueAtTime(0.95 * velocity, time);
    gain.gain.setValueAtTime(0.6 * velocity, time + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

    noise.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(gain);
    gain.connect(destination);

    noise.start(time);
    noise.stop(time + decay + 0.05);
  }

  // =========================================================================
  // 10. PRO PERCUSSION FX / DRIFT ZAP
  // =========================================================================
  private playProFx(time: number, velocity: number, destination: AudioNode, kitId: DrumKitId, pitchOffset: number = 0) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const pitchMult = Math.pow(2, pitchOffset / 12);

    osc.type = kitId === 'glitch' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(1400 * pitchMult, time);
    osc.frequency.exponentialRampToValueAtTime(80 * pitchMult, time + 0.24);

    gain.gain.setValueAtTime(0.85 * velocity, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + 0.35);
  }
}
