import { AudioSlice, SlicexSession } from '../types/daw';

const SLICE_PALETTE = [
  '#ff5722', '#ff9800', '#ffc107', '#4caf50', 
  '#00bcd4', '#2196f3', '#9c27b0', '#e91e63',
  '#00e676', '#3d5afe', '#f50057', '#ff6d00',
  '#00b0ff', '#76ff03', '#d500f9', '#ffd600',
];

export class TransientSlicer {
  private static activeSource: AudioBufferSourceNode | null = null;

  /**
   * Detects transient slice points in an AudioBuffer based on spectral flux & energy onset.
   */
  public static detectSlices(
    buffer: AudioBuffer,
    sensitivity: number = 55, // 0 to 100
    bars: number = 2,
    bpm: number = 130
  ): AudioSlice[] {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const totalSamples = buffer.length;

    // Window configuration (10ms windows for transient sharpness)
    const windowSize = Math.floor(sampleRate * 0.01);
    const hopSize = Math.floor(windowSize / 2);
    const numHops = Math.floor((totalSamples - windowSize) / hopSize);

    if (numHops <= 0) {
      return [this.createSlice(0, 0, totalSamples, buffer.duration, sampleRate)];
    }

    // 1. Calculate RMS energy per hop
    const energies = new Float32Array(numHops);
    for (let h = 0; h < numHops; h++) {
      const offset = h * hopSize;
      let sum = 0;
      for (let i = 0; i < windowSize; i++) {
        const s = channelData[offset + i];
        sum += s * s;
      }
      energies[h] = Math.sqrt(sum / windowSize);
    }

    // 2. Compute Spectral Flux (Positive energy onset difference)
    const flux = new Float32Array(numHops);
    let maxFlux = 0;
    for (let h = 1; h < numHops; h++) {
      const diff = energies[h] - energies[h - 1];
      flux[h] = Math.max(0, diff);
      if (flux[h] > maxFlux) maxFlux = flux[h];
    }

    // Normalize flux
    if (maxFlux > 0.0001) {
      for (let h = 0; h < numHops; h++) {
        flux[h] /= maxFlux;
      }
    }

    // 3. Peak picking with adaptive threshold
    // Sensitivity: 0 -> threshold 0.45, 100 -> threshold 0.04
    const threshold = 0.45 - (Math.max(0, Math.min(100, sensitivity)) / 100) * 0.41;
    const minDistanceSamples = Math.floor(sampleRate * 0.065); // Min 65ms between slices
    const minDistanceHops = Math.floor(minDistanceSamples / hopSize);

    const slicePoints: number[] = [0]; // First slice always starts at sample 0

    let lastSliceHop = 0;
    for (let h = 2; h < numHops - 2; h++) {
      if (h - lastSliceHop < minDistanceHops) continue;

      const current = flux[h];
      const prev = flux[h - 1];
      const next = flux[h + 1];

      // Local maximum above threshold
      if (current > threshold && current >= prev && current >= next) {
        let sampleIndex = h * hopSize;

        // Snap to closest zero-crossing to eliminate clicks
        sampleIndex = this.findNearestZeroCrossing(channelData, sampleIndex, 128);

        if (sampleIndex > slicePoints[slicePoints.length - 1] + minDistanceSamples) {
          slicePoints.push(sampleIndex);
          lastSliceHop = h;
        }
      }
    }

    // Fallback: If loop has no distinct onsets or too few, fall back to beat division
    if (slicePoints.length <= 2 && bars > 0) {
      slicePoints.length = 0;
      const beats = bars * 4;
      const beatSamples = Math.floor(totalSamples / beats);
      for (let b = 0; b < beats; b++) {
        slicePoints.push(b * beatSamples);
      }
    }

    // 4. Construct AudioSlice models
    const slices: AudioSlice[] = [];
    for (let i = 0; i < slicePoints.length; i++) {
      const startSample = slicePoints[i];
      const endSample = i < slicePoints.length - 1 ? slicePoints[i + 1] : totalSamples;
      const startTime = startSample / sampleRate;
      const duration = (endSample - startSample) / sampleRate;

      slices.push({
        id: `slice_${i}_${startSample}`,
        sliceIndex: i,
        startSample,
        endSample,
        startTime,
        duration,
        color: SLICE_PALETTE[i % SLICE_PALETTE.length],
      });
    }

    return slices;
  }

  /**
   * Find nearest zero crossing to avoid audio clicks at boundary
   */
  private static findNearestZeroCrossing(data: Float32Array, centerIndex: number, searchRadius: number): number {
    const start = Math.max(0, centerIndex - searchRadius);
    const end = Math.min(data.length - 1, centerIndex + searchRadius);

    let bestIndex = centerIndex;
    let minAbs = Infinity;

    for (let i = start; i < end; i++) {
      // Check sign change
      if ((data[i] <= 0 && data[i + 1] >= 0) || (data[i] >= 0 && data[i + 1] <= 0)) {
        return i;
      }
      const absVal = Math.abs(data[i]);
      if (absVal < minAbs) {
        minAbs = absVal;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  private static createSlice(
    index: number,
    startSample: number,
    endSample: number,
    duration: number,
    sampleRate: number
  ): AudioSlice {
    return {
      id: `slice_${index}`,
      sliceIndex: index,
      startSample,
      endSample,
      startTime: startSample / sampleRate,
      duration,
      color: SLICE_PALETTE[0],
    };
  }

  /**
   * Extracts a standalone AudioBuffer for a specific slice
   */
  public static extractSliceBuffer(
    parentBuffer: AudioBuffer,
    slice: AudioSlice,
    ctx: AudioContext | OfflineAudioContext
  ): AudioBuffer {
    const numChannels = parentBuffer.numberOfChannels;
    const length = Math.max(1, slice.endSample - slice.startSample);
    const sliceBuffer = ctx.createBuffer(numChannels, length, parentBuffer.sampleRate);

    for (let ch = 0; ch < numChannels; ch++) {
      const src = parentBuffer.getChannelData(ch);
      const dest = sliceBuffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        dest[i] = src[slice.startSample + i] || 0;
      }

      // Quick 2ms fade-in / fade-out to ensure 0 pop
      const fadeSamples = Math.min(Math.floor(parentBuffer.sampleRate * 0.002), Math.floor(length / 4));
      for (let f = 0; f < fadeSamples; f++) {
        const factor = f / fadeSamples;
        dest[f] *= factor;
        dest[length - 1 - f] *= factor;
      }
    }

    return sliceBuffer;
  }

  /**
   * Audition / preview a single slice in real-time
   */
  public static auditionSlice(
    parentBuffer: AudioBuffer,
    slice: AudioSlice,
    ctx: AudioContext,
    destination?: AudioNode
  ) {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch (e) {
        // Ignore already stopped
      }
      this.activeSource = null;
    }

    const source = ctx.createBufferSource();
    source.buffer = parentBuffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, ctx.currentTime);

    source.connect(gain);
    gain.connect(destination || ctx.destination);

    const startTime = slice.startTime;
    const duration = slice.duration;

    source.start(ctx.currentTime, startTime, duration);
    this.activeSource = source;

    source.onended = () => {
      if (this.activeSource === source) {
        this.activeSource = null;
      }
    };
  }

  /**
   * Generates a sample breakbeat AudioBuffer if none is loaded
   */
  public static createDemoBreakbeat(ctx: AudioContext | OfflineAudioContext): AudioBuffer {
    const rate = ctx.sampleRate || 44100;
    const bpm = 130;
    const totalSeconds = (60 / bpm) * 4 * 2; // 2 bars = 8 beats
    const totalSamples = Math.floor(rate * totalSeconds);
    const buffer = ctx.createBuffer(2, totalSamples, rate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const beatSamples = Math.floor(rate * (60 / bpm));
    const sixteenth = Math.floor(beatSamples / 4);

    // Render a punchy drum loop into the buffer
    const renderKick = (start: number) => {
      const len = Math.floor(rate * 0.22);
      for (let i = 0; i < len && start + i < totalSamples; i++) {
        const t = i / rate;
        const freq = 130 * Math.exp(-t * 32) + 42;
        const val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 12);
        left[start + i] += val * 0.9;
        right[start + i] += val * 0.9;
      }
    };

    const renderSnare = (start: number) => {
      const len = Math.floor(rate * 0.18);
      for (let i = 0; i < len && start + i < totalSamples; i++) {
        const t = i / rate;
        const tone = Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 22);
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * 16);
        const val = tone * 0.4 + noise * 0.6;
        left[start + i] += val * 0.8;
        right[start + i] += val * 0.8;
      }
    };

    const renderHihat = (start: number, open: boolean = false) => {
      const len = Math.floor(rate * (open ? 0.15 : 0.04));
      for (let i = 0; i < len && start + i < totalSamples; i++) {
        const t = i / rate;
        const noise = (Math.random() * 2 - 1) * Math.exp(-t * (open ? 20 : 60));
        left[start + i] += noise * 0.35;
        right[start + i] += noise * 0.35;
      }
    };

    // 2 Bars = 32 sixteenth steps
    const kickSteps = [0, 6, 10, 14, 16, 22, 26];
    const snareSteps = [4, 12, 20, 28];
    const hatSteps = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

    kickSteps.forEach((s) => renderKick(s * sixteenth));
    snareSteps.forEach((s) => renderSnare(s * sixteenth));
    hatSteps.forEach((s) => renderHihat(s * sixteenth, s % 8 === 6));

    return buffer;
  }
}
