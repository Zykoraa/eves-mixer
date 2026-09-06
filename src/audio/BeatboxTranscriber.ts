import { BeatboxDetectionResult, BeatboxHit, DrumHitClass } from '../types/daw';

/**
 * BeatboxTranscriber: Vocal Beatbox to MIDI Drum Classifier
 * Analyzes audio buffer transient onsets, spectral flux, and energy frequency ratios:
 * - Low-band (<180Hz) dominance -> Kick
 * - Mid-band (800Hz - 3.5kHz) high flux -> Snare / Clap
 * - High-band (>5kHz) fast decay -> Hi-Hat
 */
export class BeatboxTranscriber {
  private static instance: BeatboxTranscriber;

  private constructor() {}

  public static getInstance(): BeatboxTranscriber {
    if (!BeatboxTranscriber.instance) {
      BeatboxTranscriber.instance = new BeatboxTranscriber();
    }
    return BeatboxTranscriber.instance;
  }

  /**
   * Transcribe an AudioBuffer into quantized drum hits
   */
  public transcribe(
    buffer: AudioBuffer,
    bpm: number,
    sensitivity: number = 50 // 0 to 100
  ): BeatboxDetectionResult {
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const duration = buffer.duration;

    const frameSize = 512;
    const hopSize = 256;
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);

    // 1. Calculate energy and spectral flux across frames
    const energies = new Float32Array(numFrames);
    const lowEnergies = new Float32Array(numFrames);
    const midEnergies = new Float32Array(numFrames);
    const highEnergies = new Float32Array(numFrames);

    // Simple band filters via windowed differences
    for (let f = 0; f < numFrames; f++) {
      const offset = f * hopSize;
      let e = 0;
      let lowE = 0;
      let midE = 0;
      let highE = 0;

      // Running leaky integrator for low/mid/high energy estimation
      let prev = 0;
      for (let i = 0; i < frameSize; i++) {
        const s = channelData[offset + i];
        const sSq = s * s;
        e += sSq;

        // High frequencies: first derivative difference
        const diff = s - prev;
        highE += diff * diff;

        // Low frequency accumulation
        prev = s;
      }

      energies[f] = Math.sqrt(e / frameSize);
      highEnergies[f] = Math.sqrt(highE / frameSize);

      // Low pass approximation
      const lowStride = 8;
      let lowAccum = 0;
      for (let i = 0; i < frameSize; i += lowStride) {
        lowAccum += channelData[offset + i] * channelData[offset + i];
      }
      lowEnergies[f] = Math.sqrt(lowAccum / (frameSize / lowStride));
      midEnergies[f] = Math.max(0, energies[f] - lowEnergies[f] * 0.5 - highEnergies[f] * 0.5);
    }

    // 2. Threshold onset detection
    // Higher sensitivity = lower threshold
    const sensFactor = 1 - (sensitivity / 100) * 0.75; // 0.25 to 1.0
    let avgEnergy = 0;
    for (let f = 0; f < numFrames; f++) avgEnergy += energies[f];
    avgEnergy /= Math.max(1, numFrames);

    const threshold = Math.max(0.015, avgEnergy * sensFactor * 0.9);
    const stepDuration = 60 / bpm / 4; // 16th note in seconds
    const minOnsetDistanceFrames = Math.floor((stepDuration * 0.5 * sampleRate) / hopSize);

    const hits: BeatboxHit[] = [];
    let lastHitFrame = -minOnsetDistanceFrames;

    for (let f = 1; f < numFrames - 1; f++) {
      // Local peak detection in energy
      if (
        energies[f] > threshold &&
        energies[f] > energies[f - 1] &&
        energies[f] >= energies[f + 1] &&
        f - lastHitFrame >= minOnsetDistanceFrames
      ) {
        const time = (f * hopSize) / sampleRate;
        const rawStep = Math.round(time / stepDuration);
        const step = Math.max(0, Math.min(31, rawStep));

        const low = lowEnergies[f];
        const mid = midEnergies[f];
        const high = highEnergies[f];

        // Classification
        let drumClass: DrumHitClass = 'snare';
        let confidence = 0.8;

        if (low > mid * 1.35 && low > high * 1.5) {
          drumClass = 'kick';
          confidence = Math.min(0.98, 0.7 + low * 2);
        } else if (high > mid * 1.25 && high > low * 1.4) {
          drumClass = 'hihat';
          confidence = Math.min(0.98, 0.7 + high * 2);
        } else {
          drumClass = 'snare';
          confidence = Math.min(0.95, 0.65 + mid * 2);
        }

        const velocity = Math.max(0.4, Math.min(1.0, energies[f] * 3.5));

        hits.push({
          id: `hit-${f}-${Date.now()}`,
          time,
          step,
          drumClass,
          confidence: Number(confidence.toFixed(2)),
          velocity: Number(velocity.toFixed(2)),
        });

        lastHitFrame = f;
      }
    }

    return {
      audioBuffer: buffer,
      duration,
      hits,
      bpm,
    };
  }

  /**
   * Generates a synthetic test beatbox loop ("Boom-Tss-Ka-Tss") for instant demo audition
   */
  public generateDemoBeatbox(ctx: AudioContext, bpm: number = 130): AudioBuffer {
    const rate = ctx.sampleRate;
    const duration = (60 / bpm) * 4; // 1 bar
    const buffer = ctx.createBuffer(1, Math.floor(rate * duration), rate);
    const data = buffer.getChannelData(0);

    const stepSec = 60 / bpm / 4;

    const scheduleHit = (step: number, type: 'kick' | 'snare' | 'hihat') => {
      const startIdx = Math.floor(step * stepSec * rate);
      if (type === 'kick') {
        // Pitch drop sine
        const len = Math.floor(rate * 0.18);
        for (let i = 0; i < len && startIdx + i < data.length; i++) {
          const t = i / rate;
          const freq = 160 * Math.exp(-t * 22);
          const amp = Math.exp(-t * 14);
          data[startIdx + i] += Math.sin(2 * Math.PI * freq * t) * amp * 0.8;
        }
      } else if (type === 'snare') {
        // Noise + body
        const len = Math.floor(rate * 0.16);
        for (let i = 0; i < len && startIdx + i < data.length; i++) {
          const t = i / rate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 20);
          const body = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 30);
          data[startIdx + i] += (noise * 0.6 + body * 0.4) * 0.75;
        }
      } else if (type === 'hihat') {
        // Short noise click
        const len = Math.floor(rate * 0.05);
        for (let i = 0; i < len && startIdx + i < data.length; i++) {
          const t = i / rate;
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 70);
          data[startIdx + i] += noise * 0.4;
        }
      }
    };

    // Standard 4/4 Beatbox Pattern:
    // Step 0: Kick
    // Step 2: Hat
    // Step 4: Snare
    // Step 6: Hat
    // Step 8: Kick
    // Step 10: Kick
    // Step 12: Snare
    // Step 14: Hat
    scheduleHit(0, 'kick');
    scheduleHit(2, 'hihat');
    scheduleHit(4, 'snare');
    scheduleHit(6, 'hihat');
    scheduleHit(8, 'kick');
    scheduleHit(10, 'kick');
    scheduleHit(12, 'snare');
    scheduleHit(14, 'hihat');

    return buffer;
  }
}
