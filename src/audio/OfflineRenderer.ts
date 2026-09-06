import JSZip from 'jszip';
import { ChannelTrack, Pattern, PlaylistClip, SynthParameters } from '../types/daw';
import { DrumSynth } from './DrumSynth';
import { SynthEngine } from './SynthEngine';
import { InstrumentEngine } from './InstrumentEngine';

export interface StemExportOptions {
  bitDepth: 16 | 32;
  includeMaster: boolean;
  normalize: boolean;
}

export class OfflineRenderer {
  /**
   * Renders the complete song mix into a master WAV file
   */
  public static async renderSong(
    tracks: ChannelTrack[],
    patterns: Pattern[],
    clips: PlaylistClip[],
    synthParams: SynthParameters,
    bpm: number,
    totalBars: number,
    bitDepth: 16 | 32 = 16,
    onProgress?: (pct: number) => void
  ): Promise<Blob> {
    const buffer = await this.renderTracksToBuffer(
      tracks,
      patterns,
      clips,
      synthParams,
      bpm,
      totalBars,
      undefined, // All tracks
      onProgress
    );

    return this.audioBufferToWav(buffer, bitDepth);
  }

  /**
   * Renders individual tracks/stems and packages them into a .ZIP archive
   */
  public static async renderStemsToZip(
    projectName: string,
    tracks: ChannelTrack[],
    patterns: Pattern[],
    clips: PlaylistClip[],
    synthParams: SynthParameters,
    bpm: number,
    totalBars: number,
    options: StemExportOptions = { bitDepth: 16, includeMaster: true, normalize: false },
    onProgress?: (progress: number, statusText: string) => void
  ): Promise<Blob> {
    const zip = new JSZip();
    const activeTracks = tracks.filter((t) => !t.mute);
    const totalSteps = activeTracks.length + (options.includeMaster ? 1 : 0);
    let currentStep = 0;

    // 1. Render individual track stems
    for (const track of activeTracks) {
      currentStep++;
      const pctBase = (currentStep - 1) / totalSteps;
      const pctNext = currentStep / totalSteps;

      if (onProgress) {
        onProgress(Math.floor(pctBase * 100), `Rendering Stem: ${track.name}...`);
      }

      const stemBuffer = await this.renderTracksToBuffer(
        tracks,
        patterns,
        clips,
        synthParams,
        bpm,
        totalBars,
        new Set([track.id]),
        (subPct) => {
          if (onProgress) {
            const overall = Math.floor((pctBase + (subPct / 100) * (pctNext - pctBase)) * 100);
            onProgress(overall, `Rendering Stem: ${track.name} (${subPct}%)...`);
          }
        }
      );

      const safeName = track.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const stemBlob = this.audioBufferToWav(stemBuffer, options.bitDepth);
      zip.file(`${safeName}_Stem.wav`, stemBlob);
    }

    // 2. Render Full Master Mix
    if (options.includeMaster) {
      if (onProgress) {
        onProgress(90, 'Rendering Full Master Mix...');
      }
      const masterBuffer = await this.renderTracksToBuffer(
        tracks,
        patterns,
        clips,
        synthParams,
        bpm,
        totalBars,
        undefined,
        (subPct) => {
          if (onProgress) {
            onProgress(90 + Math.floor(subPct * 0.08), `Rendering Full Master Mix (${subPct}%)...`);
          }
        }
      );
      const masterBlob = this.audioBufferToWav(masterBuffer, options.bitDepth);
      zip.file(`${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_MasterMix.wav`, masterBlob);
    }

    // 3. Add Project Info text file
    const infoContent = `=== Eve's Mixer Pro Studio Audio Engine ===\n` +
      `Project: ${projectName}\n` +
      `Tempo: ${bpm} BPM\n` +
      `Total Length: ${totalBars} Bars\n` +
      `Format: ${options.bitDepth}-bit WAV (44.1 kHz)\n` +
      `Rendered Stems: ${activeTracks.map((t) => t.name).join(', ')}\n` +
      `Exported: ${new Date().toISOString()}\n`;
    zip.file('Session_Info.txt', infoContent);

    if (onProgress) {
      onProgress(98, 'Compressing Multi-Track Stems into ZIP Archive...');
    }

    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    if (onProgress) {
      onProgress(100, 'Stem Export Complete!');
    }
    return zipBlob;
  }

  /**
   * Internal engine to render selected or all tracks using OfflineAudioContext
   */
  private static async renderTracksToBuffer(
    tracks: ChannelTrack[],
    patterns: Pattern[],
    clips: PlaylistClip[],
    synthParams: SynthParameters,
    bpm: number,
    totalBars: number,
    filterTrackIds?: Set<string>,
    onProgress?: (pct: number) => void
  ): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const secondsPerBar = (60.0 / bpm) * 4;
    const totalSeconds = totalBars * secondsPerBar + 2.0; // 2s reverb tail
    const totalFrames = Math.ceil(totalSeconds * sampleRate);

    const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);
    const drumSynth = new DrumSynth(offlineCtx as unknown as AudioContext);
    const synthEngine = new SynthEngine(offlineCtx as unknown as AudioContext);
    const instrumentEngine = new InstrumentEngine(offlineCtx as unknown as AudioContext);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.95, 0);
    masterGain.connect(offlineCtx.destination);

    const totalSteps = totalBars * 16;
    const secondsPer16th = 60.0 / bpm / 4.0;

    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
      const currentBar = stepIndex / 16;
      const time = stepIndex * secondsPer16th;

      for (const clip of clips) {
        if (clip.type === 'pattern' && clip.patternId) {
          if (currentBar >= clip.startBar && currentBar < clip.startBar + clip.lengthBars) {
            const pattern = patterns.find((p) => p.id === clip.patternId);
            if (!pattern) continue;

            const stepInClip = (stepIndex - Math.floor(clip.startBar * 16)) % pattern.lengthSteps;

            // Channel rack steps
            for (const track of tracks) {
              if (track.mute) continue;
              if (filterTrackIds && !filterTrackIds.has(track.id)) continue;

              const trackSteps = track.steps[pattern.id];
              if (trackSteps && trackSteps[stepInClip]?.active) {
                const s = trackSteps[stepInClip];
                const velocity = (s.velocity || 0.8) * track.volume;

                if (track.type === 'drum' && track.soundId) {
                  drumSynth.trigger(
                    track.soundId,
                    time,
                    velocity,
                    masterGain,
                    track.customAudioUrl,
                    track.drumKitId || 'trap',
                    s.pitchOffset || 0
                  );
                } else if (track.type === 'instrument' && track.instrumentId) {
                  const pitch = 60 + (s.pitchOffset || 0);
                  instrumentEngine.noteOn(track.instrumentId, pitch, velocity, time, masterGain);
                  instrumentEngine.noteOff(track.instrumentId, pitch, time + secondsPer16th * 0.95);
                } else if (track.type === 'synth') {
                  const pitch = 48 + (s.pitchOffset || 0);
                  synthEngine.noteOn(pitch, velocity, time, synthParams, masterGain);
                  synthEngine.noteOff(pitch, time + secondsPer16th * 0.95, synthParams);
                }
              }
            }

            // Piano roll notes
            if (pattern.notes && pattern.notes.length > 0) {
              for (const note of pattern.notes) {
                if (note.startStep === stepInClip) {
                  const track = tracks.find((t) => t.id === note.trackId);
                  if (!track || track.mute) continue;
                  if (filterTrackIds && !filterTrackIds.has(track.id)) continue;

                  const velocity = (note.velocity || 0.8) * track.volume;
                  const durationSec = (note.durationSteps * 60) / bpm / 4;

                  if (track.type === 'synth') {
                    synthEngine.noteOn(note.midiNote, velocity, time, synthParams, masterGain);
                    synthEngine.noteOff(note.midiNote, time + durationSec, synthParams);
                  } else if (track.type === 'instrument' && track.instrumentId) {
                    instrumentEngine.noteOn(track.instrumentId, note.midiNote, velocity, time, masterGain);
                    instrumentEngine.noteOff(track.instrumentId, note.midiNote, time + durationSec);
                  }
                }
              }
            }
          }
        }
      }

      if (onProgress && stepIndex % 32 === 0) {
        onProgress(Math.floor((stepIndex / totalSteps) * 50));
      }
    }

    if (onProgress) onProgress(60);
    const rendered = await offlineCtx.startRendering();
    if (onProgress) onProgress(90);
    return rendered;
  }

  /**
   * Convert AudioBuffer to WAV format (16-bit PCM or 32-bit Float)
   */
  public static audioBufferToWav(buffer: AudioBuffer, bitDepth: 16 | 32 = 16): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = bitDepth === 32 ? 4 : 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const bufferArray = new ArrayBuffer(44 + dataSize);
    const view = new DataView(bufferArray);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    // fmt sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, bitDepth === 32 ? 3 : 1, true); // 3 = IEEE Float, 1 = PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio samples
    let offset = 44;
    if (bitDepth === 32) {
      for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          view.setFloat32(offset, buffer.getChannelData(ch)[i], true);
          offset += 4;
        }
      }
    } else {
      for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
          const s = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
          const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
          view.setInt16(offset, int16, true);
          offset += 2;
        }
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  public static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
