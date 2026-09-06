import { LooperDeck } from '../types/daw';

export class LooperStation {
  private ctx: AudioContext;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode;
  private directMonitorGain: GainNode;
  public micAnalyser: AnalyserNode;
  private micData: Float32Array;

  // Recording state
  private activeRecordingDeck: number | null = null;
  private recordingChunks: Float32Array[] = [];
  private recordingSampleCount = 0;
  private recordNode: ScriptProcessorNode | null = null; // High compatibility for real-time PCM capture
  private outputDestination: AudioNode;

  // Deck playback nodes
  private deckSources: Map<number, { source: AudioBufferSourceNode; gain: GainNode; pan: StereoPannerNode }> = new Map();

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.outputDestination = destination;

    this.micGain = ctx.createGain();
    this.micGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.directMonitorGain = ctx.createGain();
    this.directMonitorGain.gain.setValueAtTime(0.0, ctx.currentTime); // Off by default to avoid feedback

    this.micAnalyser = ctx.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.micData = new Float32Array(this.micAnalyser.frequencyBinCount);

    this.directMonitorGain.connect(destination);
  }

  public async initMic(): Promise<boolean> {
    try {
      if (this.micStream) return true;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      this.micStream = stream;
      this.micSource = this.ctx.createMediaStreamSource(stream);

      this.micSource.connect(this.micGain);
      this.micGain.connect(this.micAnalyser);
      this.micGain.connect(this.directMonitorGain);

      return true;
    } catch (err) {
      console.warn('Microphone access denied or not available:', err);
      return false;
    }
  }

  public isMicActive(): boolean {
    return this.micStream !== null;
  }

  public setMicGain(volume: number) {
    this.micGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  public setDirectMonitor(enabled: boolean, volume: number = 0.8) {
    this.directMonitorGain.gain.setTargetAtTime(enabled ? volume : 0, this.ctx.currentTime, 0.05);
  }

  public getMicPeak(): number {
    if (!this.micStream) return 0;
    this.micAnalyser.getFloatTimeDomainData(this.micData as unknown as Float32Array<ArrayBuffer>);
    let max = 0;
    for (let i = 0; i < this.micData.length; i++) {
      const abs = Math.abs(this.micData[i]);
      if (abs > max) max = abs;
    }
    return Math.min(1.0, max);
  }

  public startRecording(deckNumber: number) {
    if (!this.micStream || !this.micSource) return;
    this.activeRecordingDeck = deckNumber;
    this.recordingChunks = [];
    this.recordingSampleCount = 0;

    // Create script processor for raw PCM capture
    this.recordNode = this.ctx.createScriptProcessor(4096, 1, 1);
    this.recordNode.onaudioprocess = (e) => {
      if (this.activeRecordingDeck === null) return;
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      this.recordingChunks.push(copy);
      this.recordingSampleCount += input.length;
    };

    this.micGain.connect(this.recordNode);
    this.recordNode.connect(this.ctx.destination); // Required for scriptProcessor to clock
  }

  public stopRecording(): { buffer: AudioBuffer; waveform: number[] } | null {
    if (this.activeRecordingDeck === null || !this.recordNode) return null;

    try {
      this.micGain.disconnect(this.recordNode);
      this.recordNode.disconnect();
      this.recordNode.onaudioprocess = null;
      this.recordNode = null;
    } catch {
      // ignore
    }

    if (this.recordingSampleCount === 0) {
      this.activeRecordingDeck = null;
      return null;
    }

    // Merge chunks into AudioBuffer
    const audioBuffer = this.ctx.createBuffer(1, this.recordingSampleCount, this.ctx.sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    let offset = 0;
    for (const chunk of this.recordingChunks) {
      channelData.set(chunk, offset);
      offset += chunk.length;
    }

    // Generate waveform peak summary (e.g. 100 points)
    const pointsCount = 100;
    const step = Math.floor(channelData.length / pointsCount);
    const waveform: number[] = [];
    for (let i = 0; i < pointsCount; i++) {
      let max = 0;
      const start = i * step;
      for (let j = 0; j < step && start + j < channelData.length; j++) {
        const val = Math.abs(channelData[start + j]);
        if (val > max) max = val;
      }
      waveform.push(max);
    }

    this.activeRecordingDeck = null;
    this.recordingChunks = [];
    this.recordingSampleCount = 0;

    return { buffer: audioBuffer, waveform };
  }

  public overdubBuffer(existing: AudioBuffer, newBuffer: AudioBuffer): AudioBuffer {
    const len = Math.max(existing.length, newBuffer.length);
    const merged = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const out = merged.getChannelData(0);
    const oldData = existing.getChannelData(0);
    const newData = newBuffer.getChannelData(0);

    for (let i = 0; i < len; i++) {
      const a = i < oldData.length ? oldData[i] : 0;
      const b = i < newData.length ? newData[i] : 0;
      // Soft sum to prevent clipping
      out[i] = Math.tanh(a + b * 0.9);
    }
    return merged;
  }

  public startDeckPlayback(deck: LooperDeck, bpm: number, destination: AudioNode = this.outputDestination) {
    if (!deck.audioBuffer) return;
    this.stopDeckPlayback(deck.deckNumber);

    let playBuffer = deck.audioBuffer;
    if (deck.reverse) {
      playBuffer = this.reverseAudioBuffer(deck.audioBuffer);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = playBuffer;
    source.loop = true;

    // Pitch & playback rate
    // semitone shift: 2^(semitones / 12)
    let rate = Math.pow(2, deck.pitchShift / 12);
    if (deck.halfSpeed) {
      rate *= 0.5;
    }
    source.playbackRate.setValueAtTime(rate, this.ctx.currentTime);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(deck.mute ? 0 : deck.volume, this.ctx.currentTime);

    const panNode = this.ctx.createStereoPanner();
    panNode.pan.setValueAtTime(deck.pan, this.ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(destination);

    source.start(0);
    this.deckSources.set(deck.deckNumber, { source, gain: gainNode, pan: panNode });
  }

  public stopDeckPlayback(deckNumber: number) {
    const existing = this.deckSources.get(deckNumber);
    if (existing) {
      try {
        existing.source.stop();
        existing.source.disconnect();
      } catch {
        // Already stopped
      }
      this.deckSources.delete(deckNumber);
    }
  }

  public updateDeckParameters(deckNumber: number, volume: number, pan: number, mute: boolean) {
    const existing = this.deckSources.get(deckNumber);
    if (existing) {
      existing.gain.gain.setTargetAtTime(mute ? 0 : volume, this.ctx.currentTime, 0.02);
      existing.pan.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.02);
    }
  }

  private reverseAudioBuffer(buffer: AudioBuffer): AudioBuffer {
    const rev = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const source = buffer.getChannelData(c);
      const dest = rev.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        dest[i] = source[buffer.length - 1 - i];
      }
    }
    return rev;
  }

  public bufferToWavBlob(buffer: AudioBuffer): Blob {
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
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    // DATA sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // PCM samples (16-bit)
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
}
