import { ChannelTrack, Pattern, PlaylistClip, SynthParameters } from '../types/daw';
import { DrumSynth } from './DrumSynth';
import { SynthEngine } from './SynthEngine';

export class WavExporter {
  public static async exportSongToWav(
    tracks: ChannelTrack[],
    patterns: Pattern[],
    clips: PlaylistClip[],
    synthParams: SynthParameters,
    bpm: number,
    totalBars: number,
    onProgress?: (pct: number) => void
  ): Promise<Blob> {
    const sampleRate = 44100;
    const secondsPerBar = (60.0 / bpm) * 4;
    const totalSeconds = totalBars * secondsPerBar + 2.0; // tail for reverb/delay
    const totalFrames = Math.ceil(totalSeconds * sampleRate);

    const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

    const drumSynth = new DrumSynth(offlineCtx as unknown as AudioContext);
    const synthEngine = new SynthEngine(offlineCtx as unknown as AudioContext);

    const masterGain = offlineCtx.createGain();
    masterGain.connect(offlineCtx.destination);

    // Schedule all clips
    const totalSteps = totalBars * 16;
    const secondsPer16th = 60.0 / bpm / 4.0;

    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
      const currentBar = stepIndex / 16;
      const time = stepIndex * secondsPer16th;

      for (const clip of clips) {
        if (clip.type === 'pattern' && clip.patternId) {
          if (currentBar >= clip.startBar && currentBar < clip.startBar + clip.lengthBars) {
            const pattern = patterns.find((p) => p.id === clip.patternId);
            if (pattern) {
              const stepInClip = (stepIndex - clip.startBar * 16) % pattern.lengthSteps;
              // Schedule drum hits & synth steps
              for (const track of tracks) {
                if (track.mute) continue;
                const trackSteps = track.steps[pattern.id];
                if (trackSteps && trackSteps[stepInClip]?.active) {
                  const s = trackSteps[stepInClip];
                  if (track.type === 'drum' && track.soundId) {
                    drumSynth.trigger(track.soundId, time, s.velocity * track.volume, masterGain);
                  } else if (track.type === 'synth') {
                    const pitch = 48 + (s.pitchOffset || 0);
                    synthEngine.noteOn(pitch, s.velocity * track.volume, time, synthParams, masterGain);
                    setTimeout(() => {
                      synthEngine.noteOff(pitch, time + secondsPer16th * 1.5, synthParams);
                    }, 0);
                  }
                }
              }

              // Schedule piano roll notes
              if (pattern.notes) {
                for (const note of pattern.notes) {
                  if (note.startStep === stepInClip) {
                    const track = tracks.find((t) => t.id === note.trackId);
                    if (track && !track.mute && track.type === 'synth') {
                      synthEngine.noteOn(note.midiNote, note.velocity * track.volume, time, synthParams, masterGain);
                      const dur = (note.durationSteps * 60) / bpm / 4;
                      synthEngine.noteOff(note.midiNote, time + dur, synthParams);
                    }
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
    const renderedBuffer = await offlineCtx.startRendering();
    if (onProgress) onProgress(90);

    const blob = WavExporter.audioBufferToWav(renderedBuffer);
    if (onProgress) onProgress(100);
    return blob;
  }

  public static audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length * numChannels * 2;
    const bufferArray = new ArrayBuffer(44 + length);
    const view = new DataView(bufferArray);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, 'WAVE');
    // FMT sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    // DATA sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Write interleaved 16-bit PCM samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  public static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
