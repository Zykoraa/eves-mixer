import { ImpulseResponseMeta } from '../types/daw';

export const FACTORY_IMPULSES: ImpulseResponseMeta[] = [
  // Guitar Cabinets
  {
    id: 'cab_v30',
    name: 'Celestion Vintage 30 (4x12)',
    category: 'cabinet',
    description: 'Punchy 2.8kHz mid-range spike, tight low end, legendary rock & metal cab.',
    sampleRate: 44100,
  },
  {
    id: 'cab_twin',
    name: "Fender '65 Twin Reverb (2x12)",
    category: 'cabinet',
    description: 'Glassy highs, scooped mids, open sparkle and chime.',
    sampleRate: 44100,
  },
  {
    id: 'cab_greenback',
    name: 'Marshall 1960A Greenback (4x12)',
    category: 'cabinet',
    description: 'Warm woody breakup, creamy vintage British crunch.',
    sampleRate: 44100,
  },
  {
    id: 'cab_ac30',
    name: 'Vox AC30 Alnico Blue (2x12)',
    category: 'cabinet',
    description: 'British invasion chime, vocal upper-mids, crystalline bite.',
    sampleRate: 44100,
  },
  {
    id: 'cab_orange',
    name: 'Orange PPC412 Heavy Sludge (4x12)',
    category: 'cabinet',
    description: 'Massive low-end resonance, thick sludge and doom wall-of-sound.',
    sampleRate: 44100,
  },
  {
    id: 'cab_ampeg',
    name: 'Ampeg SVT-810E The Fridge (8x10)',
    category: 'cabinet',
    description: 'Deep authoritative sub bass with punchy 1.5kHz attack.',
    sampleRate: 44100,
  },
  // Acoustic Spaces & Reverb
  {
    id: 'space_cathedral',
    name: 'Notre Dame Gothic Cathedral',
    category: 'space',
    description: '4.5s monumental stone cathedral with rich diffuse stereo decay.',
    sampleRate: 44100,
  },
  {
    id: 'space_abbey',
    name: 'Abbey Studio Live Chamber',
    category: 'space',
    description: '1.8s warm wooden chamber acoustic with natural presence.',
    sampleRate: 44100,
  },
  {
    id: 'space_lex480',
    name: 'Lexicon 480 Studio Gold Plate',
    category: 'space',
    description: '2.8s lush sparkling studio plate with shimmer high-end.',
    sampleRate: 44100,
  },
  {
    id: 'space_drum_room',
    name: 'Neve 8078 Live Drum Room',
    category: 'space',
    description: '0.75s explosive gated reflections, perfect for punchy drums.',
    sampleRate: 44100,
  },
  {
    id: 'space_bedroom',
    name: 'Intimate Bedroom Studio',
    category: 'space',
    description: '0.35s dry tight acoustic space for vocals and acoustic guitar.',
    sampleRate: 44100,
  },
  {
    id: 'space_stage',
    name: 'Hollywood Scoring Stage',
    category: 'space',
    description: '3.2s wide cinematic orchestral space with deep stereo imaging.',
    sampleRate: 44100,
  },
];

export class ConvolutionEngine {
  private static instance: ConvolutionEngine | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private customMetas: ImpulseResponseMeta[] = [];

  private constructor() {}

  public static getInstance(): ConvolutionEngine {
    if (!ConvolutionEngine.instance) {
      ConvolutionEngine.instance = new ConvolutionEngine();
    }
    return ConvolutionEngine.instance;
  }

  public getAvailableImpulses(): ImpulseResponseMeta[] {
    return [...FACTORY_IMPULSES, ...this.customMetas];
  }

  public async getImpulseBuffer(id: string, ctx: AudioContext | OfflineAudioContext): Promise<AudioBuffer> {
    if (this.bufferCache.has(id)) {
      return this.bufferCache.get(id)!;
    }

    const generated = this.generateSyntheticImpulse(id, ctx);
    this.bufferCache.set(id, generated);
    return generated;
  }

  public async loadCustomImpulse(file: File, ctx: AudioContext | OfflineAudioContext): Promise<ImpulseResponseMeta> {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const customId = `custom_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const meta: ImpulseResponseMeta = {
      id: customId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category: 'space',
      description: `User custom impulse response (${decoded.duration.toFixed(2)}s, ${decoded.numberOfChannels}ch)`,
      sampleRate: decoded.sampleRate,
    };

    this.bufferCache.set(customId, decoded);
    this.customMetas.push(meta);
    return meta;
  }

  /**
   * Generates high-fidelity physics-modeled synthetic impulse responses
   */
  private generateSyntheticImpulse(id: string, ctx: AudioContext | OfflineAudioContext): AudioBuffer {
    const rate = ctx.sampleRate || 44100;

    switch (id) {
      // --- GUITAR CABINETS ---
      case 'cab_v30':
        return this.createCabinetImpulse(ctx, rate, 0.08, 75, 2800, 4800, 0.003);
      case 'cab_twin':
        return this.createCabinetImpulse(ctx, rate, 0.09, 65, 3200, 6000, 0.004);
      case 'cab_greenback':
        return this.createCabinetImpulse(ctx, rate, 0.085, 80, 2400, 4200, 0.0035);
      case 'cab_ac30':
        return this.createCabinetImpulse(ctx, rate, 0.075, 85, 3400, 5600, 0.0028);
      case 'cab_orange':
        return this.createCabinetImpulse(ctx, rate, 0.095, 60, 2200, 3900, 0.0042);
      case 'cab_ampeg':
        return this.createCabinetImpulse(ctx, rate, 0.11, 45, 1400, 3200, 0.005);

      // --- ACOUSTIC REVERB SPACES ---
      case 'space_cathedral':
        return this.createReverbImpulse(ctx, rate, 4.5, 0.04, 0.85, 0.7);
      case 'space_abbey':
        return this.createReverbImpulse(ctx, rate, 1.8, 0.02, 0.65, 0.8);
      case 'space_lex480':
        return this.createReverbImpulse(ctx, rate, 2.8, 0.015, 0.9, 0.95);
      case 'space_drum_room':
        return this.createGatedRoomImpulse(ctx, rate, 0.75, 0.008);
      case 'space_bedroom':
        return this.createReverbImpulse(ctx, rate, 0.35, 0.005, 0.4, 0.5);
      case 'space_stage':
        return this.createReverbImpulse(ctx, rate, 3.2, 0.03, 0.8, 0.85);

      default:
        return this.createReverbImpulse(ctx, rate, 1.5, 0.02, 0.6, 0.7);
    }
  }

  private createCabinetImpulse(
    ctx: AudioContext | OfflineAudioContext,
    rate: number,
    duration: number,
    lowResFreq: number,
    midPeakFreq: number,
    highCutFreq: number,
    coneDecay: number
  ): AudioBuffer {
    const length = Math.floor(rate * duration);
    const buffer = ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const lowOmega = (2 * Math.PI * lowResFreq) / rate;
    const midOmega = (2 * Math.PI * midPeakFreq) / rate;
    const highDamp = Math.exp((-2 * Math.PI * highCutFreq) / rate);

    let filterL = 0;
    let filterR = 0;

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const decay = Math.exp(-t / coneDecay);

      // Raw white noise impulse
      const noiseL = (Math.random() * 2 - 1) * decay;
      const noiseR = (Math.random() * 2 - 1) * decay;

      // Cone speaker acoustic resonance ringing
      const lowRes = Math.sin(i * lowOmega) * Math.exp(-t * 28);
      const midRes = Math.sin(i * midOmega) * Math.exp(-t * 45) * 1.5;

      // Lowpass smoothing filter simulating speaker air resistance
      filterL = filterL * highDamp + (noiseL + lowRes + midRes) * (1 - highDamp);
      filterR = filterR * highDamp + (noiseR + lowRes * 0.9 + midRes * 1.1) * (1 - highDamp);

      // First sample transient punch
      const initialPunch = i === 0 ? 1.0 : i === 1 ? -0.4 : 0;

      left[i] = (filterL * 0.6 + initialPunch) * 0.8;
      right[i] = (filterR * 0.6 + initialPunch * 0.95) * 0.8;
    }

    return buffer;
  }

  private createReverbImpulse(
    ctx: AudioContext | OfflineAudioContext,
    rate: number,
    duration: number,
    preDelaySec: number,
    diffusion: number,
    highDampFactor: number
  ): AudioBuffer {
    const length = Math.floor(rate * duration);
    const buffer = ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const preDelaySamples = Math.floor(rate * preDelaySec);
    const decayConstant = 6.91 / duration; // -60dB RT60

    // Early reflections pattern
    const earlyDelays = [0.012, 0.019, 0.027, 0.035, 0.043, 0.052, 0.061];
    const earlyGains = [0.7, 0.55, 0.45, 0.38, 0.3, 0.25, 0.18];

    for (let e = 0; e < earlyDelays.length; e++) {
      const sL = Math.floor(rate * (preDelaySec + earlyDelays[e]));
      const sR = Math.floor(rate * (preDelaySec + earlyDelays[e] * 1.08));
      if (sL < length) left[sL] += earlyGains[e] * (e % 2 === 0 ? 1 : -0.8);
      if (sR < length) right[sR] += earlyGains[e] * (e % 2 === 0 ? -0.8 : 1);
    }

    // Late diffuse tail with frequency dependent absorption
    let prevL = 0;
    let prevR = 0;
    const dampAlpha = 1 - highDampFactor * 0.4;

    for (let i = preDelaySamples; i < length; i++) {
      const t = (i - preDelaySamples) / rate;
      const env = Math.exp(-t * decayConstant);

      const nL = (Math.random() * 2 - 1 + (Math.random() * 2 - 1) * 0.5) * env * diffusion;
      const nR = (Math.random() * 2 - 1 + (Math.random() * 2 - 1) * 0.5) * env * diffusion;

      prevL = prevL * dampAlpha + nL * (1 - dampAlpha);
      prevR = prevR * dampAlpha + nR * (1 - dampAlpha);

      left[i] += prevL * 0.7;
      right[i] += prevR * 0.7;
    }

    return buffer;
  }

  private createGatedRoomImpulse(
    ctx: AudioContext | OfflineAudioContext,
    rate: number,
    duration: number,
    preDelaySec: number
  ): AudioBuffer {
    const length = Math.floor(rate * duration);
    const gateCutSample = Math.floor(length * 0.65);
    const buffer = ctx.createBuffer(2, length, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const preDelaySamples = Math.floor(rate * preDelaySec);

    for (let i = preDelaySamples; i < length; i++) {
      if (i > gateCutSample) {
        const releaseT = (i - gateCutSample) / (length - gateCutSample);
        const gate = Math.max(0, 1 - releaseT * 8);
        left[i] = (Math.random() * 2 - 1) * 0.3 * gate;
        right[i] = (Math.random() * 2 - 1) * 0.3 * gate;
      } else {
        left[i] = (Math.random() * 2 - 1) * 0.5;
        right[i] = (Math.random() * 2 - 1) * 0.5;
      }
    }

    return buffer;
  }
}
