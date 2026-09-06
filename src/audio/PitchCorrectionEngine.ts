// PitchCorrectionEngine.ts - Monophonic Vocal Pitch Detection & Correction (NewTone / Melodyne)
// Features: YIN / Autocorrelation pitch estimator, Note segmentation, Scale-snapping quantization,
// Trajectory curve computation, Resynthesis playback, and Piano Roll / Playlist export.

import { PitchNoteSegment, PitchCorrectionSession, MusicalScale, RootNote, PianoNote } from '../types/daw';
import { isNoteInScale, NOTE_NAMES } from './Presets';

export class PitchCorrectionEngine {
  private static instance: PitchCorrectionEngine;
  private ctx: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;

  private constructor() {}

  public static getInstance(): PitchCorrectionEngine {
    if (!PitchCorrectionEngine.instance) {
      PitchCorrectionEngine.instance = new PitchCorrectionEngine();
    }
    return PitchCorrectionEngine.instance;
  }

  public init(ctx: AudioContext) {
    this.ctx = ctx;
  }

  // Analyze an AudioBuffer and segment it into vocal note blocks
  public analyzeBuffer(buffer: AudioBuffer, fileName: string): PitchCorrectionSession {
    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const frameSize = 2048;
    const hopSize = 512;
    const numFrames = Math.floor((channelData.length - frameSize) / hopSize);

    const minFreq = 65; // ~C2
    const maxFreq = 1050; // ~C6
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    interface FrameInfo {
      frameIndex: number;
      time: number;
      sampleStart: number;
      freq: number;
      midi: number;
      energy: number;
    }

    const frames: FrameInfo[] = [];

    // Frame-by-frame pitch estimation using autocorrelation
    for (let f = 0; f < numFrames; f++) {
      const sampleOffset = f * hopSize;
      const time = sampleOffset / sampleRate;

      // Compute RMS Energy
      let energySum = 0;
      for (let i = 0; i < frameSize; i++) {
        const val = channelData[sampleOffset + i];
        energySum += val * val;
      }
      const rms = Math.sqrt(energySum / frameSize);

      // Silence or breath threshold
      if (rms < 0.015) {
        frames.push({ frameIndex: f, time, sampleStart: sampleOffset, freq: 0, midi: 0, energy: rms });
        continue;
      }

      // Autocorrelation within minPeriod to maxPeriod
      let bestCorrelation = -1;
      let bestPeriod = -1;

      for (let tau = minPeriod; tau <= maxPeriod; tau++) {
        let corr = 0;
        let normA = 0;
        let normB = 0;

        for (let j = 0; j < frameSize - tau; j += 2) {
          const a = channelData[sampleOffset + j];
          const b = channelData[sampleOffset + j + tau];
          corr += a * b;
          normA += a * a;
          normB += b * b;
        }

        const norm = Math.sqrt(normA * normB);
        const normalizedCorr = norm > 0.0001 ? corr / norm : 0;

        if (normalizedCorr > bestCorrelation) {
          bestCorrelation = normalizedCorr;
          bestPeriod = tau;
        }
      }

      if (bestCorrelation > 0.55 && bestPeriod > 0) {
        const freq = sampleRate / bestPeriod;
        // Convert to fractional MIDI note
        const midi = 69 + 12 * Math.log2(freq / 440);
        frames.push({ frameIndex: f, time, sampleStart: sampleOffset, freq, midi, energy: rms });
      } else {
        frames.push({ frameIndex: f, time, sampleStart: sampleOffset, freq: 0, midi: 0, energy: rms });
      }
    }

    // Segment consecutive pitched frames into distinct note blocks
    const segments: PitchNoteSegment[] = [];
    let currentSegmentFrames: FrameInfo[] = [];

    const flushSegment = () => {
      if (currentSegmentFrames.length >= 3) {
        // Minimum ~35ms to qualify as a sung note
        const avgMidi =
          currentSegmentFrames.reduce((acc, fr) => acc + fr.midi, 0) / currentSegmentFrames.length;
        const targetMidi = Math.round(avgMidi);
        const startFr = currentSegmentFrames[0];
        const endFr = currentSegmentFrames[currentSegmentFrames.length - 1];

        const trajectory = currentSegmentFrames.map((fr) => fr.midi - targetMidi);
        const avgRms =
          currentSegmentFrames.reduce((acc, fr) => acc + fr.energy, 0) / currentSegmentFrames.length;

        segments.push({
          id: `pitch-seg-${segments.length + 1}-${Date.now()}`,
          startIndex: startFr.sampleStart,
          endIndex: endFr.sampleStart + frameSize,
          startTime: startFr.time,
          duration: (endFr.sampleStart + frameSize - startFr.sampleStart) / sampleRate,
          detectedMidi: Math.round(avgMidi * 100) / 100,
          targetMidi,
          centDeviation: Math.round((avgMidi - targetMidi) * 100),
          trajectory,
          volume: Math.min(1.0, avgRms * 3),
        });
      }
      currentSegmentFrames = [];
    };

    for (let i = 0; i < frames.length; i++) {
      const fr = frames[i];
      if (fr.freq > 0) {
        if (currentSegmentFrames.length === 0) {
          currentSegmentFrames.push(fr);
        } else {
          const prevMidi = currentSegmentFrames[currentSegmentFrames.length - 1].midi;
          // If note pitch jumps more than 1.6 semitones, split into a new note segment
          if (Math.abs(fr.midi - prevMidi) < 1.6) {
            currentSegmentFrames.push(fr);
          } else {
            flushSegment();
            currentSegmentFrames.push(fr);
          }
        }
      } else {
        flushSegment();
      }
    }
    flushSegment();

    return {
      audioBuffer: buffer,
      fileName,
      segments,
      selectedSegmentId: segments.length > 0 ? segments[0].id : null,
      correctionAmount: 100,
      fineTuneCents: 0,
      formantShift: 0,
    };
  }

  // Snap all note segments to a musical scale
  public snapSessionToScale(
    session: PitchCorrectionSession,
    rootKey: RootNote,
    scale: MusicalScale
  ): PitchCorrectionSession {
    const updatedSegments = session.segments.map((seg) => {
      let bestNote = seg.targetMidi;
      if (!isNoteInScale(bestNote, rootKey, scale)) {
        // Search closest in-scale note within +/- 2 semitones
        let minDiff = 999;
        for (let delta = -3; delta <= 3; delta++) {
          const candidate = seg.targetMidi + delta;
          if (isNoteInScale(candidate, rootKey, scale)) {
            const diff = Math.abs(delta);
            if (diff < minDiff) {
              minDiff = diff;
              bestNote = candidate;
            }
          }
        }
      }
      return {
        ...seg,
        targetMidi: bestNote,
        centDeviation: Math.round((seg.detectedMidi - bestNote) * 100),
      };
    });

    return {
      ...session,
      segments: updatedSegments,
    };
  }

  // Resynthesize tuned audio buffer with pitch correction applied
  public renderTunedBuffer(session: PitchCorrectionSession): AudioBuffer | null {
    if (!this.ctx || !session.audioBuffer) return null;

    const original = session.audioBuffer;
    const numChannels = original.numberOfChannels;
    const sampleRate = original.sampleRate;
    const output = this.ctx.createBuffer(numChannels, original.length, sampleRate);

    // Copy original channels first
    for (let c = 0; c < numChannels; c++) {
      output.getChannelData(c).set(original.getChannelData(c));
    }

    // Apply pitch shifts to segments using granular cross-resampling
    for (const seg of session.segments) {
      const semitoneShift =
        (seg.targetMidi - seg.detectedMidi) * (session.correctionAmount / 100) +
        session.fineTuneCents / 100;

      if (Math.abs(semitoneShift) < 0.05) continue; // Minor shift, keep natural

      const pitchRatio = Math.pow(2, semitoneShift / 12);
      const start = Math.max(0, seg.startIndex);
      const end = Math.min(original.length, seg.endIndex);
      const len = end - start;
      if (len <= 0) continue;

      for (let c = 0; c < numChannels; c++) {
        const inCh = original.getChannelData(c);
        const outCh = output.getChannelData(c);

        // Simple high-quality pitch interpolation
        for (let i = 0; i < len; i++) {
          const srcIdx = start + i * pitchRatio;
          if (srcIdx < inCh.length - 1) {
            const idx0 = Math.floor(srcIdx);
            const frac = srcIdx - idx0;
            const resampled = inCh[idx0] * (1 - frac) + inCh[idx0 + 1] * frac;

            // Fade in/out edges to eliminate clicks
            const edgeFade = Math.min(1.0, Math.min(i / 128, (len - i) / 128));
            outCh[start + i] = inCh[start + i] * (1 - edgeFade) + resampled * edgeFade;
          }
        }
      }
    }

    return output;
  }

  // Audition tuned audio buffer
  public playTunedPreview(session: PitchCorrectionSession, onEnded?: () => void) {
    if (!this.ctx) return;
    this.stopPreview();

    const tuned = this.renderTunedBuffer(session);
    if (!tuned) return;

    this.activeSource = this.ctx.createBufferSource();
    this.activeSource.buffer = tuned;
    this.activeSource.connect(this.ctx.destination);
    this.activeSource.onended = () => {
      this.activeSource = null;
      if (onEnded) onEnded();
    };
    this.activeSource.start();
  }

  public stopPreview() {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch (err) {
        // already stopped
      }
      this.activeSource = null;
    }
  }

  // Convert vocal pitch blocks directly into PianoRoll notes
  public exportToPianoRollNotes(session: PitchCorrectionSession, trackId: string, bpm: number): PianoNote[] {
    const secondsPer16th = 60 / bpm / 4;
    return session.segments.map((seg, idx) => {
      const startStep = Math.max(0, Math.round(seg.startTime / secondsPer16th));
      const durationSteps = Math.max(1, Math.round(seg.duration / secondsPer16th));

      return {
        id: `vocal-note-${idx}-${Date.now()}`,
        trackId,
        midiNote: Math.max(0, Math.min(127, seg.targetMidi)),
        startStep,
        durationSteps,
        velocity: Math.max(0.4, Math.min(1.0, seg.volume)),
      };
    });
  }
}
